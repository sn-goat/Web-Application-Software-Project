import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

const minNumber = 1000;
const maxNumber = 9000;

@Component({
    selector: 'app-attente-page',
    templateUrl: './attente-page.component.html',
    styleUrls: ['./attente-page.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class AttentePageComponent implements OnInit {
    accessCode: string = '';

    ngOnInit() {
        this.generateAccessCode();
    }

    generateAccessCode() {
        this.accessCode = Math.floor(minNumber + Math.random() * maxNumber).toString();
    }
}
