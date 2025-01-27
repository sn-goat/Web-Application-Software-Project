import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
        this.accessCode = Math.floor(1000 + Math.random() * 9000).toString();
    }
}