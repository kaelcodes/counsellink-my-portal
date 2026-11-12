import { Injectable } from '@angular/core';
import { BuildDetails } from './build-details';

@Injectable({ providedIn: 'root' })
export class BuildDetailsService {
    public buildDetails: BuildDetails;

    constructor() {
        this.buildDetails = new BuildDetails();
    }
}
