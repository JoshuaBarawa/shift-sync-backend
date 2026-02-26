import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { SwapRequest, SwapStatus, SwapType } from './entities/swap-request.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { CreateSwapDto } from './dtos/create-swap.dto';
import { RejectDto } from './dtos/reject.dto';

const MAX_PENDING_REQUESTS = 3;

@Injectable()
export class SwapsService {
  constructor(
    @InjectModel(SwapRequest)
    private readonly swapModel: typeof SwapRequest,

    @InjectModel(Shift)
    private readonly shiftModel: typeof Shift,

    @InjectModel(ShiftAssignment)
    private readonly assignmentModel: typeof ShiftAssignment,

    @InjectModel(User)
    private readonly userModel: typeof User,

    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async create(requesterId: number, dto: CreateSwapDto): Promise<SwapRequest> {
    const pendingCount = await this.swapModel.count({
      where: {
        requesterId,
        status: { [Op.in]: [SwapStatus.PENDING_ACCEPTANCE, SwapStatus.OPEN, SwapStatus.PENDING_APPROVAL] },
      },
    });
    if (pendingCount >= MAX_PENDING_REQUESTS) {
      throw new BadRequestException(`You cannot have more than ${MAX_PENDING_REQUESTS} pending requests at once`);
    }

    const assignment = await this.assignmentModel.findOne({ where: { shiftId: dto.requesterShiftId, userId: requesterId } });
    if (!assignment) throw new BadRequestException('You are not assigned to this shift');

    const requesterShift = await this.shiftModel.findOne({ where: { id: dto.requesterShiftId } });
    if (!requesterShift) throw new NotFoundException('Shift not found');

    const requester = await this.userModel.findOne({ where: { id: requesterId } });

    if (dto.type === SwapType.SWAP) {
      if (!dto.requesteeId || !dto.requesteeShiftId) {
        throw new BadRequestException('Swap requests require requesteeId and requesteeShiftId');
      }
      const requesteeAssignment = await this.assignmentModel.findOne({ where: { shiftId: dto.requesteeShiftId, userId: dto.requesteeId } });
      if (!requesteeAssignment) throw new BadRequestException('Staff B is not assigned to that shift');

      const swap = await this.swapModel.create({
        type: SwapType.SWAP, status: SwapStatus.PENDING_ACCEPTANCE,
        requesterId, requesteeId: dto.requesteeId,
        requesterShiftId: dto.requesterShiftId, requesteeShiftId: dto.requesteeShiftId,
        reason: dto.reason,
      } as any);

      await this.auditService.log(requesterId, AuditAction.SWAP_REQUESTED, 'swap', swap.id,
        `${requester?.name} requested a swap with user #${dto.requesteeId}`);
      await this.notificationsService.notifySwapRequested(dto.requesteeId, swap.id, requester?.name ?? 'A colleague');

      return swap;
    }

    // DROP
    const shiftDateTime = new Date(`${requesterShift.date}T${requesterShift.startTime}`);
    const hoursUntilShift = (shiftDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilShift < 24) {
      throw new BadRequestException('Cannot drop a shift less than 24 hours before it starts');
    }

    const expiresAt = new Date(shiftDateTime.getTime() - 24 * 60 * 60 * 1000);
    const swap = await this.swapModel.create({
      type: SwapType.DROP, status: SwapStatus.OPEN,
      requesterId, requesterShiftId: dto.requesterShiftId,
      reason: dto.reason, expiresAt,
    } as any);

    await this.auditService.log(requesterId, AuditAction.SWAP_REQUESTED, 'swap', swap.id,
      `${requester?.name} created a drop request for shift #${dto.requesterShiftId}`);

    return swap;
  }

  async findAll(userId?: number, status?: SwapStatus): Promise<SwapRequest[]> {
    const where: any = {};
    if (status) where.status = status;
    if (userId) where[Op.or as any] = [{ requesterId: userId }, { requesteeId: userId }];

    return this.swapModel.findAll({
      where,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'requestee', attributes: ['id', 'name', 'email'] },
        { model: Shift, as: 'requesterShift' },
        { model: Shift, as: 'requesteeShift' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: number): Promise<SwapRequest> {
    const swap = await this.swapModel.findOne({
      where: { id },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'requestee', attributes: ['id', 'name', 'email'] },
        { model: Shift, as: 'requesterShift' },
        { model: Shift, as: 'requesteeShift' },
      ],
    });
    if (!swap) throw new NotFoundException(`Swap request ${id} not found`);
    return swap;
  }

  async accept(swapId: number, userId: number): Promise<SwapRequest> {
    const swap = await this.findOne(swapId);
    if (swap.requesteeId !== userId) throw new ForbiddenException('Only the requestee can accept this swap');
    if (swap.status !== SwapStatus.PENDING_ACCEPTANCE) throw new BadRequestException(`Cannot accept a request with status: ${swap.status}`);

    await swap.update({ status: SwapStatus.PENDING_APPROVAL });

    const requestee = await this.userModel.findOne({ where: { id: userId } });
    await this.auditService.log(userId, AuditAction.SWAP_ACCEPTED, 'swap', swapId, `${requestee?.name} accepted swap request #${swapId}`);
    await this.notificationsService.notifySwapAccepted(swap.requesterId, swapId, requestee?.name ?? 'Your colleague');

    return this.findOne(swapId);
  }

  async decline(swapId: number, userId: number, dto: RejectDto): Promise<SwapRequest> {
    const swap = await this.findOne(swapId);
    if (swap.requesteeId !== userId) throw new ForbiddenException('Only the requestee can decline this swap');
    if (swap.status !== SwapStatus.PENDING_ACCEPTANCE) throw new BadRequestException(`Cannot decline a request with status: ${swap.status}`);

    await swap.update({ status: SwapStatus.REJECTED, rejectionReason: dto.reason });

    const requestee = await this.userModel.findOne({ where: { id: userId } });
    await this.auditService.log(userId, AuditAction.SWAP_DECLINED, 'swap', swapId, `${requestee?.name} declined swap request #${swapId}`);
    await this.notificationsService.notifySwapDeclined(swap.requesterId, swapId, requestee?.name ?? 'Your colleague', dto.reason);

    return this.findOne(swapId);
  }

  async pickup(swapId: number, userId: number): Promise<SwapRequest> {
    const swap = await this.findOne(swapId);
    if (swap.type !== SwapType.DROP) throw new BadRequestException('This is not a drop request');
    if (swap.status !== SwapStatus.OPEN) throw new BadRequestException(`This drop request is no longer open (status: ${swap.status})`);
    if (swap.requesterId === userId) throw new BadRequestException('You cannot pick up your own drop request');

    if (swap.expiresAt && new Date() > swap.expiresAt) {
      await swap.update({ status: SwapStatus.EXPIRED });
      throw new BadRequestException('This drop request has expired');
    }

    await swap.update({ requesteeId: userId, status: SwapStatus.PENDING_APPROVAL });

    const picker = await this.userModel.findOne({ where: { id: userId } });
    await this.auditService.log(userId, AuditAction.DROP_PICKED_UP, 'swap', swapId, `${picker?.name} picked up drop request #${swapId}`);
    await this.notificationsService.notifyDropPickedUp(swap.requesterId, swapId, picker?.name ?? 'A colleague');

    return this.findOne(swapId);
  }

  async cancel(swapId: number, userId: number): Promise<SwapRequest> {
    const swap = await this.findOne(swapId);
    if (swap.requesterId !== userId) throw new ForbiddenException('Only the requester can cancel this request');

    const cancellableStatuses = [SwapStatus.PENDING_ACCEPTANCE, SwapStatus.OPEN, SwapStatus.PENDING_APPROVAL];
    if (!cancellableStatuses.includes(swap.status)) throw new BadRequestException(`Cannot cancel a request with status: ${swap.status}`);

    await swap.update({ status: SwapStatus.CANCELLED });
    await this.auditService.log(userId, AuditAction.SWAP_CANCELLED, 'swap', swapId, `User #${userId} cancelled swap request #${swapId}`);

    return this.findOne(swapId);
  }

  async approve(swapId: number, managerId: number): Promise<SwapRequest> {
    const swap = await this.findOne(swapId);
    if (swap.status !== SwapStatus.PENDING_APPROVAL) throw new BadRequestException(`Cannot approve a request with status: ${swap.status}`);

    if (swap.type === SwapType.SWAP) {
      await this.assignmentModel.update({ userId: swap.requesteeId }, { where: { shiftId: swap.requesterShiftId, userId: swap.requesterId } });
      await this.assignmentModel.update({ userId: swap.requesterId }, { where: { shiftId: swap.requesteeShiftId, userId: swap.requesteeId } });
    } else {
      await this.assignmentModel.destroy({ where: { shiftId: swap.requesterShiftId, userId: swap.requesterId } });
      await this.assignmentModel.create({ shiftId: swap.requesterShiftId, userId: swap.requesteeId } as any);
    }

    await swap.update({ status: SwapStatus.APPROVED, managerId });

    await this.auditService.log(managerId, AuditAction.SWAP_APPROVED, 'swap', swapId, `Manager #${managerId} approved swap request #${swapId}`);

    const notifyIds = [swap.requesterId];
    if (swap.requesteeId) notifyIds.push(swap.requesteeId);
    await this.notificationsService.notifySwapApproved(notifyIds, swapId);

    return this.findOne(swapId);
  }

  async managerReject(swapId: number, managerId: number, dto: RejectDto): Promise<SwapRequest> {
    const swap = await this.findOne(swapId);
    if (swap.status !== SwapStatus.PENDING_APPROVAL) throw new BadRequestException(`Cannot reject a request with status: ${swap.status}`);

    await swap.update({ status: SwapStatus.REJECTED, managerId, rejectionReason: dto.reason });

    await this.auditService.log(managerId, AuditAction.SWAP_REJECTED, 'swap', swapId,
      `Manager #${managerId} rejected swap request #${swapId}${dto.reason ? `: ${dto.reason}` : ''}`);

    const notifyIds = [swap.requesterId];
    if (swap.requesteeId) notifyIds.push(swap.requesteeId);
    await this.notificationsService.notifySwapRejected(notifyIds, swapId, dto.reason);

    return this.findOne(swapId);
  }

  async cancelPendingSwapsForShift(shiftId: number): Promise<void> {
    await this.swapModel.update(
      { status: SwapStatus.CANCELLED, rejectionReason: 'Shift was edited by manager' },
      {
        where: {
          [Op.or]: [{ requesterShiftId: shiftId }, { requesteeShiftId: shiftId }],
          status: { [Op.in]: [SwapStatus.PENDING_ACCEPTANCE, SwapStatus.OPEN, SwapStatus.PENDING_APPROVAL] },
        },
      },
    );
  }

  async expireDropRequests(): Promise<void> {
    await this.swapModel.update(
      { status: SwapStatus.EXPIRED },
      { where: { type: SwapType.DROP, status: SwapStatus.OPEN, expiresAt: { [Op.lt]: new Date() } } },
    );
  }
}