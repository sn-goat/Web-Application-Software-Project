import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-create-page',
  templateUrl: './create-page.component.html',
  styleUrls: ['./create-page.component.scss'],
  imports: [RouterLink],
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
}