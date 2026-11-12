import { Injectable } from '@angular/core';

import { BuildDetailsService } from './build-details.service';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { BuildDetails } from './build-details';

@Injectable({ providedIn: 'root' })
export class BuildDetailsHttpService {

    constructor(private http: HttpClient, private buildDetailsService: BuildDetailsService) {
    }

    fetchBuildDetails(): Promise<any> {

        const httpOptions = {
            headers: new HttpHeaders({
                'Cache-Control': 'no-cache'
            })
        };

        return new Promise<void>(
            (resolve) => {
                this.http.get<BuildDetails>('assets/build-details.json', httpOptions)
                    .toPromise()
                    .then(response => {
                        this.buildDetailsService.buildDetails = response;
                        resolve();
                    });
            }
        );
    }
}
