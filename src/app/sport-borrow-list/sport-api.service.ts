import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { GlobalService } from '../global.service';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SportApiService {

    constructor(
        private http: Http,
        private global: GlobalService
    ) { }

    /**
 * Get all borrow requests
 */
    getBorrowRequest(idNumber: string | null, startDate: Date | null, endDate: Date | null): Observable<any> {
        const params: string[] = [];
        if (idNumber) params.push(`UserID=${idNumber}`);
        if (startDate) params.push(`StartDate=${startDate.toISOString()}`);
        if (endDate) params.push(`EndDate=${endDate.toISOString()}`);

        const queryString = params.length ? `?${params.join('&')}` : '';
        console.log(this.global.api + 'SportsEquipment/BorrowRequests' + queryString);

        return this.http.get(this.global.api + 'SportsEquipment/BorrowRequests' + queryString, this.global.option)
            .map(response => response.json());
    }

    /**
     * Get borrow requests filtered by logged-in user and full name.
     */
    getBorrowRequestsForLoggedInUser(userId: string, fullName: string): Observable<any> {
        const schoolYearRange = this.getSchoolYearDateRange();
        console.log('School year date range:', schoolYearRange.startDate, schoolYearRange.endDate);

        return this.getBorrowRequest(userId, schoolYearRange.startDate, schoolYearRange.endDate)
            .map(response => {
                const data = response.data || [];
                console.log('Raw API Response:', response);
                console.log('Raw API Data:', data);
                console.log('Filtering with UserId:', userId, 'FullName:', fullName);
                const filtered = this.filterByUserIdAndName(data, userId, fullName);
                console.log('After Filtering:', filtered);
                return filtered;
            });
    }

    /**
     * Get borrow request items
     */
    getBorrowRequestItems(): Observable<any> {
        return this.http.get(this.global.api + 'SportsEquipment/BorrowRequestItems', this.global.option)
            .map(response => response.json());
    }

    /**
     * Get borrow request by ID
     */
    getBorrowRequestById(id: number): Observable<any> {
        return this.http.get(this.global.api + 'SportsEquipment/BorrowRequests/' + id, this.global.option)
            .map(response => response.json());
    }

    public getSchoolYearDateRange(sy: string = this.global.sy): { startDate: Date | null; endDate: Date | null } {
        if (!sy || sy.length < 4) {
            return { startDate: null, endDate: null };
        }

        const startYear = parseInt(sy.substring(0, 4), 10);
        if (isNaN(startYear)) {
            return { startDate: null, endDate: null };
        }

        return {
            startDate: new Date(startYear, 7, 1), // August 1
            endDate: new Date(startYear + 1, 5, 30, 23, 59, 59, 999) // June 30
        };
    }

    /**
     * Filter borrow requests by user ID and full name
     */
    private filterByUserIdAndName(requests: any[], userId: string, fullName: string): any {
        if (!userId && !fullName) {
            console.log('No userId or fullName provided, returning all requests');
            return requests;
        }

        const idTarget = (userId || '').toString().trim();
        const nameTarget = this.normalizeName(fullName);
        const nameTargetNoComma = nameTarget.replace(/,/g, '');

        const filtered = requests.filter((req, index) => {
            console.log(`Checking request ${index}:`, JSON.stringify(req, null, 2));
            // Check by UserID field - prioritize idnumber, then userID
            if (idTarget) {
                const reqUserId = (req.idnumber || req.idNumber || req.userID || req.UserID || req.userid || req.userId || req.BorrowerID || req.borrowerid || req.ID || '').toString().trim();
                console.log(`  UserID check: reqUserId='${reqUserId}' vs idTarget='${idTarget}' - Match: ${reqUserId === idTarget}`);
                if (reqUserId && reqUserId === idTarget) {
                    return true;
                }
            }

            // Check by full name field
            if (nameTarget) {
                const borrowerFullName = this.normalizeName(req.BorrowerFullName || req.borrowerFullName || req.borrower || req.borrowerName || '');
                console.log(`  Name check: borrowerFullName='${borrowerFullName}' vs nameTarget='${nameTarget}' - Match: ${borrowerFullName === nameTarget}`);
                if (borrowerFullName === nameTarget || borrowerFullName.replace(/,/g, '') === nameTargetNoComma) {
                    return true;
                }
            }

            return false;
        });

        return filtered;
    }

    /**
     * Normalize name string for comparison
     */
    private normalizeName(name: string): string {
        if (!name) {
            return '';
        }
        return name.toString().trim().toUpperCase();
    }
}
