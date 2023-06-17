import { Injectable } from '@nestjs/common';
import axios from 'axios';
const Agenda = require('agenda');

const MongoDbURL =
  'mongodb+srv://admin:admin@cluster0.quwzg.mongodb.net/reminder-app?retryWrites=true&w=majority';

@Injectable()
export class AppService {
  agenda: any;

  async initializeScheduler() {
    const agenda = new Agenda({
      db: { address: MongoDbURL },
      collection: 'agendaJobs',
    });

    agenda.define('schedule_notification', async (job) => {
      const { data: notificationData } = job.attrs;
      this.sendNotification(notificationData);
    });

    await agenda.start();
    this.agenda = agenda;
  }

  scheduleNotification(data): any {
    const reminderPayload = {
      recipientPhoneNumber: data.friendPhoneNumber,
      recipientName: data.friendName,
      message: data.message,
      originName: data.userName,
      originPhoneNumber: data.userPhoneNumber,
      time: data.time,
      repeat: data.repeat,
      id: `${data.userPhoneNumber}-${Date.now()}`
    };
    const job = this.agenda.create('schedule_notification', reminderPayload);
    return this.determineScheduler(job, reminderPayload);
  }

  async determineScheduler(job, data) {
    try {
      if (data.repeat) {
        //TODO
      } else {
        job.schedule(data.time);
        await job.save();
        await axios.post(
          `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.originPhoneNumber}/scheduled.json`,
          data,
        );
        await axios.post(
          `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.recipientPhoneNumber}/reminders.json`,
          data,
        );
        return true;
      }
    } catch (err) {
      console.log('Error determining scheduler', err);
    }
  }

  async sendNotification(data) {
    try {
      console.log('Sending notification for data', data);
      const recipientPhoneNumber = data.recipientPhoneNumber;

      const { data: tokens } = await axios.get(
        `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${recipientPhoneNumber}/tokens.json`,
      );

      const message = {
        to: tokens.token,
        sound: 'default',
        title: `Reminder from ${data.originName}`,
        body: data.message,
        data: {
          from: data.originName,
          phoneNumber: data.originPhoneNumber,
          message: data.message,
        },
      };

     await axios.post('https://exp.host/--/api/v2/push/send', message, {
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.log('Error sending notification', err.toJSON());
    }
  }
}
