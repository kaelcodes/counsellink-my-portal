import { TestBed } from '@angular/core/testing';

import { SportApiService } from '../sport-borrow-list/sport-api.service';

describe('SportApiService', () => {
    let service: SportApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SportApiService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
