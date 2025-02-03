import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MapListComponent } from '@app/components/map-list/map-list.component';

const MAX_PORTRAITS = 12;
const D4 = './assets/dice/d4.png';
const D6 = './assets/dice/d6.png';

@Component({
    selector: 'app-create-page',
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
    imports: [RouterLink, CommonModule, FormsModule, MapListComponent],
})
export class CreatePageComponent {
    playerName: string = '';
    isPopupVisible = false;
    totalPortraits = MAX_PORTRAITS;
    currentPortraitIndex = 0;

    lifeSelected: boolean = false;
    rapiditySelected: boolean = false;
    attackSelected: boolean = false;
    defenseSelected: boolean = false;

    stats = {
        life: 4,
        rapidity: 4,
        attack: 4,
        defense: 4,
        attackDice: D4,
        defenseDice: D4,
    };

    getCurrentPortraitImage(): string {
        return `./assets/portraits/portrait${this.currentPortraitIndex + 1}.png`;
    }

    openPopup() {
        this.isPopupVisible = true;
    }

    closePopup() {
        this.isPopupVisible = false;
    }

    navigatePortrait(direction: 'prev' | 'next') {
        if (direction === 'prev') {
            this.currentPortraitIndex = (this.currentPortraitIndex - 1 + this.totalPortraits) % this.totalPortraits;
        } else if (direction === 'next') {
            this.currentPortraitIndex = (this.currentPortraitIndex + 1) % this.totalPortraits;
        }
    }

    selectLife() {
        if (this.rapiditySelected) {
            this.rapiditySelected = false;
            this.stats.rapidity = 4;
        }
        this.lifeSelected = !this.lifeSelected;
        if (this.lifeSelected) {
            this.stats.life += 2;
        } else {
            this.stats.life -= 2;
        }
    }

    selectRapidity() {
        if (this.lifeSelected) {
            this.lifeSelected = false;
            this.stats.life = 4;
        }
        this.rapiditySelected = !this.rapiditySelected;
        if (this.rapiditySelected) {
            this.stats.rapidity += 2;
        } else {
            this.stats.rapidity -= 2;
        }
    }

    selectAttack() {
        if (this.defenseSelected) {
            this.defenseSelected = false;
            this.stats.defenseDice = D4;
        }
        this.attackSelected = !this.attackSelected;
        if (this.attackSelected) {
            this.stats.attackDice = D6;
        } else {
            this.stats.attackDice = D4;
        }
    }

    selectDefense() {
        if (this.attackSelected) {
            this.attackSelected = false;
            this.stats.attackDice = D4;
        }
        this.defenseSelected = !this.defenseSelected;
        if (this.defenseSelected) {
            this.stats.defenseDice = D6;
        } else {
            this.stats.defenseDice = D4;
        }
    }

    canJoin(): boolean {
        const selectedStats = [this.lifeSelected, this.rapiditySelected, this.attackSelected, this.defenseSelected];
        return this.playerName.trim().length > 0 && selectedStats.filter((stat) => stat).length === 2;
    }
}
