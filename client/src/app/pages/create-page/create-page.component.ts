import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-create-page',
  templateUrl: './create-page.component.html',
  styleUrls: ['./create-page.component.scss'],
  imports: [RouterLink, CommonModule],
})
export class CreatePageComponent {
  showDetails(event: MouseEvent, detailsId: string) {
    const details = document.getElementById(detailsId);
    const option = (event.target as HTMLElement).closest('.option') as HTMLElement;
    if (details && option) {
      details.style.display = 'flex'; 
      option.querySelector('span')!.style.display = 'none';
      option.style.transform = 'scale(1.05)'; 
      option.style.transition = 'all 0.3s ease';
    }
  }
    
      
  hideDetails(event: MouseEvent, detailsId: string) {
    const details = document.getElementById(detailsId);
    const option = (event.target as HTMLElement).closest('.option') as HTMLElement;
    
    if (details && option) {
      details.style.display = 'none'; 
      option.querySelector('span')!.style.display = 'block';
      option.style.transform = 'scale(1)'; 
    }
  }

  isPopupVisible = false;
  totalPortraits = 12;
  currentPortraitIndex = 0;

  getCurrentPortraitImage(): string {
    return `assets/portraits/portrait-${this.currentPortraitIndex + 1}.png`;
  }

  openPopup() {
    this.isPopupVisible = true;
  }

  closePopup() {
    this.isPopupVisible = false;
  }

  navigatePortrait(direction: 'prev' | 'next') {
    if (direction === 'prev') {
      this.currentPortraitIndex =
        (this.currentPortraitIndex - 1 + this.totalPortraits) % this.totalPortraits;
    } else if (direction === 'next') {
      this.currentPortraitIndex =
        (this.currentPortraitIndex + 1) % this.totalPortraits;
    }
  }

  lifeSelected: boolean = false;
  rapiditySelected: boolean = false;
  attackSelected: boolean = false;
  defenseSelected: boolean = false;

  stats = {
    life: 4,
    rapidity: 4,
    attack: "D4",
    defense: "D4",
  };

  
  selectLife() {
    if (!this.rapiditySelected) {
      this.lifeSelected = !this.lifeSelected;
      if (this.lifeSelected) {
        this.stats.life += 2;
      } else {
        this.stats.life -= 2;
      }
    }
  }
  selectRapidity() {
    if (!this.lifeSelected) {
      this.rapiditySelected = !this.rapiditySelected;
      if (this.rapiditySelected) {
        this.stats.rapidity += 2;
      } else {
        this.stats.rapidity -= 2;
      }
    }
  }

  selectAttack() {
    if (!this.defenseSelected) {
      this.attackSelected = !this.attackSelected;
      if (this.attackSelected) {
        this.stats.attack = "D6";
      } else {
        this.stats.attack = "D4";
      }
    }
  }
  selectDefense() {
    if (!this.attackSelected) {
      this.defenseSelected = !this.defenseSelected;
      if (this.defenseSelected) {
        this.stats.defense = "D6";
      } else {
        this.stats.defense = "D4";
      }
    }
  }

}