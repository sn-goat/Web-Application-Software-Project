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

    selectStat(stat: 'life' | 'rapidity') {
        const otherStat = stat === 'life' ? 'rapidity' : 'life';
        const selectedStat = stat + 'Selected' as 'lifeSelected' | 'rapiditySelected';
        const otherSelectedStat = otherStat + 'Selected' as 'lifeSelected' | 'rapiditySelected';

        if (this[otherSelectedStat]) {
            this[otherSelectedStat] = false;
            this.stats[otherStat] = 4;
        }
        this[selectedStat] = !this[selectedStat];
        if (this[selectedStat]) {
            this.stats[stat] += 2;
        } else {
            this.stats[stat] -= 2;
        }
    }

    selectCombatStat(stat: 'attack' | 'defense') {
    const otherStat = stat === 'attack' ? 'defense' : 'attack';
    const selectedStat = stat + 'Selected' as 'attackSelected' | 'defenseSelected';
    const otherSelectedStat = otherStat + 'Selected' as 'attackSelected' | 'defenseSelected';

    if (this[otherSelectedStat]) {
        this[otherSelectedStat] = false;
        this.stats[`${otherStat}Dice`] = D4;
    }
    this[selectedStat] = !this[selectedStat];
    if (this[selectedStat]) {
        this.stats[`${stat}Dice`] = D6;
    } else {
        this.stats[`${stat}Dice`] = D4;
    }
}

    canJoin(): boolean {
        const selectedStats = [this.lifeSelected, this.rapiditySelected, this.attackSelected, this.defenseSelected];
        return this.playerName.trim().length > 0 && selectedStats.filter((stat) => stat).length === 2;
    }
}
