import { ClockService } from '../../src/common/clock/clock.service';

export class ClockServiceMock implements ClockService {
  private mockedNow = new Date();
  now(): Date {
    return this.mockedNow;
  }
}
