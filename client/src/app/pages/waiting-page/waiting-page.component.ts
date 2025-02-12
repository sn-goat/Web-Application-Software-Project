import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

const minNumber = 1000;
const maxNumber = 9000;

@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class WaitingPageComponent implements OnInit {
    accessCode: string = '';

    ngOnInit() {
        this.generateAccessCode();
    }

    generateAccessCode() {
        this.accessCode = Math.floor(minNumber + Math.random() * maxNumber).toString();
    }
}
