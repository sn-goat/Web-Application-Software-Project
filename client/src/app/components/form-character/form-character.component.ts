import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

const MAX_PORTRAITS = 12;
const D4 = './assets/dice/d4.png';
const D6 = './assets/dice/d6.png';

@Component({
    selector: 'app-form-character',
    templateUrl: './form-character.component.html',
    styleUrls: ['./form-character.component.scss'],
    imports: [CommonModule, FormsModule, RouterLink],
})
export class FormCharacterComponent {
    @Output() closePopup: EventEmitter<void> = new EventEmitter<void>();
    totalPortraits = MAX_PORTRAITS;
    currentPortraitIndex = 0;

    lifeSelected: boolean = false;
    rapiditySelected: boolean = false;
    attackSelected: boolean = false;
    defenseSelected: boolean = false;

    stats = {
        playerName: '',
        life: 4,
        rapidity: 4,
        attack: 4,
        defense: 4,
        attackDice: '',
        defenseDice: '',
    };

    getCurrentPortraitImage(): string {
        return `./assets/portraits/portrait${this.currentPortraitIndex + 1}.png`;
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
        const selectedStat = (stat + 'Selected') as 'lifeSelected' | 'rapiditySelected';
        const otherSelectedStat = (otherStat + 'Selected') as 'lifeSelected' | 'rapiditySelected';

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
        const selectedStat = (stat + 'Selected') as 'attackSelected' | 'defenseSelected';
        const otherSelectedStat = (otherStat + 'Selected') as 'attackSelected' | 'defenseSelected';

        if (this[selectedStat]) {
            // If already selected, unselect and hide dice images for both stats.
            this[selectedStat] = false;
            this.stats[`${stat}Dice`] = '';
            this.stats[`${otherStat}Dice`] = '';
        } else {
            // If not selected, select it and assign the dice images accordingly.
            this[selectedStat] = true;
            this.stats[`${stat}Dice`] = D6; // Selected stat gets D6.

            // Ensure the other stat is not selected.
            if (this[otherSelectedStat]) {
                this[otherSelectedStat] = false;
            }
            this.stats[`${otherStat}Dice`] = D4; // The other gets D4.
        }
    }

    onClose(): void {
        this.closePopup.emit();
    }

    canJoin(): boolean {
        const selectedStats = [this.lifeSelected, this.rapiditySelected, this.attackSelected, this.defenseSelected];
        return this.stats.playerName.trim().length > 0 && selectedStats.filter((stat) => stat).length === 2;
    }
}
