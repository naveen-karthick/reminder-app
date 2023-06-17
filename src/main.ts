import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const appService = app.get<AppService>(AppService);
  await appService.initializeScheduler();
  await app.listen(process.env.PORT || 3000);
  // const job = appService.agenda.create('schedule_notification', {
  //   someData: 'some random data'
  // });
  // job.schedule(1648651198016);
  // await job.save();
  // const job1 = appService.agenda.create('schedule_notification', {
  //   someData: 'some random data1'
  // });
  // job1.schedule(1648651243165);
  // await job1.save();
}
bootstrap();
