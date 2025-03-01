import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { D4, D6, MAX_PORTRAITS } from '@app/constants/playerConst';
import { Player } from '@common/player';
import { GameMapService } from '@app/services/code/game-map.service';

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

    stats: Player = {
        id: '',
        username: '',
        avatar: this.getCurrentPortraitImage(),
        life: 4,
        attack: 4,
        defense: 4,
        rapidity: 4,
        attackDice: '',
        defenseDice: '',
        movementPts: 0,
        actions: 0,
    };

    private readonly gameMapService = inject(GameMapService);

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
            this[selectedStat] = false;
            this.stats[`${stat}Dice`] = '';
            this.stats[`${otherStat}Dice`] = '';
        } else {
            this[selectedStat] = true;
            this.stats[`${stat}Dice`] = D6;

            if (this[otherSelectedStat]) {
                this[otherSelectedStat] = false;
            }
            this.stats[`${otherStat}Dice`] = D4;
        }
    }

    onClose(): void {
        this.closePopup.emit();
    }

    canJoin(): boolean {
        const selectedStats = [this.lifeSelected, this.rapiditySelected, this.attackSelected, this.defenseSelected];
        return this.stats.username.trim().length > 0 && selectedStats.filter((stat) => stat).length === 2;
    }

    shareGameMap(): void {
        this.gameMapService.shareGameMap();
    }
}
