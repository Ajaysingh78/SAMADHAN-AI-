const { getPool, getDbStatus } = require('../connection');
const memoryStore = require('../memoryStore');
const crypto = require('crypto');

class NotificationRepository {
  async create(data) {
    const dbStatus = getDbStatus();
    const id = data.id || crypto.randomUUID();

    const record = {
      id,
      user_id: data.user_id,
      event_type: data.event_type,
      title: data.title,
      message: data.message,
      complaint_id: data.complaint_id || null,
      case_id: data.case_id || null,
      read_status: Boolean(data.read_status),
      navigation_url: data.navigation_url || (data.complaint_id ? `/app/complaints/${data.complaint_id}` : '/app/workflow'),
      created_at: new Date().toISOString()
    };

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          `INSERT INTO notifications (id, user_id, event_type, title, message, complaint_id, case_id, read_status, navigation_url, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id,
            record.user_id,
            record.event_type,
            record.title,
            record.message,
            record.complaint_id,
            record.case_id,
            record.read_status,
            record.navigation_url,
            record.created_at
          ]
        );
        return record;
      } catch (err) {
        console.warn(`[NotificationRepo] MySQL insert error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.createNotification(record);
  }

  async findByUser(userId, { unreadOnly = false, limit = 50 } = {}) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [userId];

        if (unreadOnly) {
          query += ' AND read_status = FALSE';
        }
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const [rows] = await pool.query(query, params);
        return rows;
      } catch (err) {
        console.warn(`[NotificationRepo] MySQL findByUser error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findNotificationsByUser(userId, { unreadOnly, limit });
  }

  async countUnread(userId) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND read_status = FALSE',
          [userId]
        );
        return rows[0]?.unreadCount || 0;
      } catch (err) {
        console.warn(`[NotificationRepo] MySQL countUnread error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.countUnreadNotifications(userId);
  }

  async markAsRead(id, userId) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          'UPDATE notifications SET read_status = TRUE WHERE id = ? AND user_id = ?',
          [id, userId]
        );
        const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id]);
        return rows[0] || null;
      } catch (err) {
        console.warn(`[NotificationRepo] MySQL markAsRead error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.markNotificationAsRead(id, userId);
  }

  async markAllAsRead(userId) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [result] = await pool.query(
          'UPDATE notifications SET read_status = TRUE WHERE user_id = ? AND read_status = FALSE',
          [userId]
        );
        return result.affectedRows;
      } catch (err) {
        console.warn(`[NotificationRepo] MySQL markAllAsRead error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.markAllNotificationsAsRead(userId);
  }

  async hasRecentReminder(complaintId, eventType, windowHours = 24) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          `SELECT id FROM notifications
           WHERE complaint_id = ? AND event_type = ? AND created_at >= NOW() - INTERVAL ? HOUR
           LIMIT 1`,
          [complaintId, eventType, windowHours]
        );
        return rows.length > 0;
      } catch (err) {
        console.warn(`[NotificationRepo] MySQL hasRecentReminder error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.hasRecentNotification(complaintId, eventType, windowHours);
  }
}

module.exports = new NotificationRepository();
