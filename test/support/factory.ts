import { MessageTypes, NotificationTypes, Position, RadarScanNotificationMessage } from '../../src/types'

export default {
  'RadarScanNotification': (options?: { players: { position: Position }[] }): RadarScanNotificationMessage => {
    let { players } = options || { players: [] }

    return {
      type: MessageTypes.Notification,
      id: NotificationTypes.RadarScan,
      data: {
        shots: [],
        players,
        unknown: []
      }
    }
  }
}
