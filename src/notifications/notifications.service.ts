import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {}


  async notify(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    resourceId?: number,
    resourceType?: string,
  ): Promise<void> {
    await this.notificationModel.create({
      userId,
      type,
      title,
      message,
      resourceId,
      resourceType,
    } as any);
  }


  async getUserNotifications(userId: number): Promise<Notification[]> {
    return this.notificationModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.notificationModel.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: number, userId: number): Promise<void> {
    await this.notificationModel.update(
      { isRead: true },
      { where: { id, userId } },
    );
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationModel.update(
      { isRead: true },
      { where: { userId, isRead: false } },
    );
  }


  async notifyShiftAssigned(userId: number, shiftId: number, locationName: string, date: string, startTime: string, endTime: string): Promise<void> {
    await this.notify(
      userId,
      NotificationType.SHIFT_ASSIGNED,
      'New Shift Assigned',
      `You have been assigned to a shift at ${locationName} on ${date} from ${startTime} to ${endTime}`,
      shiftId,
      'shift',
    );
  }

  async notifyShiftUnassigned(userId: number, shiftId: number, locationName: string, date: string): Promise<void> {
    await this.notify(
      userId,
      NotificationType.SHIFT_UNASSIGNED,
      'Removed From Shift',
      `You have been removed from your shift at ${locationName} on ${date}`,
      shiftId,
      'shift',
    );
  }

  async notifyShiftPublished(userIds: number[], shiftId: number, locationName: string, date: string): Promise<void> {
    for (const userId of userIds) {
      await this.notify(
        userId,
        NotificationType.SHIFT_PUBLISHED,
        'Schedule Published',
        `Your shift at ${locationName} on ${date} has been published`,
        shiftId,
        'shift',
      );
    }
  }

  async notifyShiftEdited(userIds: number[], shiftId: number, locationName: string, date: string): Promise<void> {
    for (const userId of userIds) {
      await this.notify(
        userId,
        NotificationType.SHIFT_EDITED,
        'Shift Updated',
        `Your shift at ${locationName} on ${date} has been updated by a manager`,
        shiftId,
        'shift',
      );
    }
  }

  async notifyShiftCancelled(userIds: number[], shiftId: number, locationName: string, date: string): Promise<void> {
    for (const userId of userIds) {
      await this.notify(
        userId,
        NotificationType.SHIFT_CANCELLED,
        'Shift Cancelled',
        `Your shift at ${locationName} on ${date} has been cancelled`,
        shiftId,
        'shift',
      );
    }
  }

  async notifySwapRequested(requesteeId: number, swapId: number, requesterName: string): Promise<void> {
    await this.notify(
      requesteeId,
      NotificationType.SWAP_REQUESTED,
      'Swap Request Received',
      `${requesterName} has requested to swap shifts with you`,
      swapId,
      'swap',
    );
  }

  async notifySwapAccepted(requesterId: number, swapId: number, requesteeName: string): Promise<void> {
    await this.notify(
      requesterId,
      NotificationType.SWAP_ACCEPTED,
      'Swap Request Accepted',
      `${requesteeName} has accepted your swap request. Waiting for manager approval`,
      swapId,
      'swap',
    );
  }

  async notifySwapDeclined(requesterId: number, swapId: number, requesteeName: string, reason?: string): Promise<void> {
    await this.notify(
      requesterId,
      NotificationType.SWAP_DECLINED,
      'Swap Request Declined',
      `${requesteeName} has declined your swap request${reason ? `: ${reason}` : ''}`,
      swapId,
      'swap',
    );
  }

  async notifySwapApproved(userIds: number[], swapId: number): Promise<void> {
    for (const userId of userIds) {
      await this.notify(
        userId,
        NotificationType.SWAP_APPROVED,
        'Swap Approved',
        'Your shift swap has been approved by the manager. Assignments have been updated',
        swapId,
        'swap',
      );
    }
  }

  async notifySwapRejected(userIds: number[], swapId: number, reason?: string): Promise<void> {
    for (const userId of userIds) {
      await this.notify(
        userId,
        NotificationType.SWAP_REJECTED,
        'Swap Rejected',
        `Your shift swap has been rejected by the manager${reason ? `: ${reason}` : ''}`,
        swapId,
        'swap',
      );
    }
  }

  async notifyDropPickedUp(requesterId: number, swapId: number, pickerName: string): Promise<void> {
    await this.notify(
      requesterId,
      NotificationType.DROP_PICKED_UP,
      'Drop Request Picked Up',
      `${pickerName} has picked up your dropped shift. Waiting for manager approval`,
      swapId,
      'swap',
    );
  }

  async notifyOvertimeWarning(managerId: number, staffName: string, totalHours: number, shiftId: number): Promise<void> {
    await this.notify(
      managerId,
      NotificationType.OVERTIME_WARNING,
      'Overtime Warning',
      `${staffName} is approaching ${totalHours} hours this week — review before publishing`,
      shiftId,
      'shift',
    );
  }
}