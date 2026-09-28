import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('should report status ok', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok' });
  });
});
