import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
    selector: 'app-header-bar',
    imports: [MatIconModule, MatButtonModule, MatToolbarModule],
    templateUrl: './header-bar.component.html',
    styleUrl: './header-bar.component.scss',
})
export class HeaderBarComponent {
    @Input() backUrl: string;
    constructor(private router: Router) {}
    getBack() {
        this.router.navigate(['/' + this.backUrl]);
    }
}
