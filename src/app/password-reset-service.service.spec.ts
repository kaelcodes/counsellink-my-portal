import { TestBed } from '@angular/core/testing';

import { PasswordResetService } from './password-reset-service.service';

describe('PasswordResetServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PasswordResetService = TestBed.get(PasswordResetService);
    expect(service).toBeTruthy();
  });
});
