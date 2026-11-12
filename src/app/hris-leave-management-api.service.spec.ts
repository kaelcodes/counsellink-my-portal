import { TestBed } from '@angular/core/testing';

import { HrisLeaveManagementApiService } from './hris-leave-management-api.service';

describe('HrisLeaveManagementApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HrisLeaveManagementApiService = TestBed.get(HrisLeaveManagementApiService);
    expect(service).toBeTruthy();
  });
});
