import {
  Body,
  Controller,
  Get,
  HttpService,
  Param,
  Post,
} from '@nestjs/common';
import axios from 'axios';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private httpService: HttpService,
  ) {}

  @Get('test')
  async test(): Promise<any> {
    return 'working';
  }

  @Post('sign-up')
  async signupUser(@Body() data: any): Promise<any> {
    const payload = {
      name: data.name,
      token: data.token,
      phoneNumber: data.phoneNumber,
    };
    await axios.put(
      `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.phoneNumber}/tokens.json`,
      payload,
    );
    return payload;
  }

  @Post('add-friend')
  async addFriend(@Body() data: any): Promise<any> {
    const { data: existingData } = await axios.get(
      `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.userPhoneNumber}/friends.json`,
    );

    if (existingData) {
      for (let row in existingData) {
        if (existingData[row].phoneNumber === data.friendPhoneNumber) {
          return 'Friend Already added';
        }
      }
    }

    const newFriend = {
      name: data.friendName,
      phoneNumber: data.friendPhoneNumber,
    };
    await axios.post(
      `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.userPhoneNumber}/friends.json`,
      newFriend,
    );

    const { data: updatedFriendsList } = await axios.get(
      `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.userPhoneNumber}/friends.json`,
    );
    return updatedFriendsList;
  }

  @Post('schedule-notification')
  async scheduleNotification(@Body() data: any): Promise<any> {
    return this.appService.scheduleNotification(data);
  }

  @Post('cancel-notification')
  async cancelNotification(@Body() data: any): Promise<any> {
    try {
      const jobs = await this.appService.agenda.jobs({
        name: 'schedule_notification',
        'data.id': data.id,
      });

      if (jobs.length > 0) {
        const { data: scheduledReminders } = await axios.get(
          `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.originPhoneNumber}/scheduled.json`,
        );

        if (scheduledReminders) {
          const scheduledKey = Object.keys(scheduledReminders).find(
            (key) => scheduledReminders[key].id === data.id,
          );
          await axios.delete(
            `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.originPhoneNumber}/scheduled/${scheduledKey}.json`,
          );
        }

        const { data: recipientReminders } = await axios.get(
          `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.recipientPhoneNUmber}/reminders.json`,
        );

        if (recipientReminders) {
          const reminderKey = Object.keys(recipientReminders).find(
            (key) => recipientReminders[key].id === data.id,
          );

          await axios.delete(
            `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${data.recipientPhoneNUmber}/reminders/${reminderKey}.json`,
          );
        }
      }
      return true;
    } catch (err) {
      console.log('Error cancelling notification');
    }
  }

  @Get('fetch-friends/:phoneNumber')
  async fetchFriends(@Param() params): Promise<any> {
    const { data: response } = await axios.get(
      `https://reminder-app-13351-default-rtdb.asia-southeast1.firebasedatabase.app/${params.phoneNumber}/friends.json`,
    );

    if (!response) {
      return [];
    }

    return Object.keys(response).map((key) => response[key]);
  }
}
