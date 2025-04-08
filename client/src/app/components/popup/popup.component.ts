import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ChatComponent } from '@app/components/chat/chat.component';
import { JournalComponent } from '@app/components/journal/journal.component';
import { PopupService } from '@app/services/popup/popup.service';

@Component({
    selector: 'app-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
    imports: [ChatComponent, JournalComponent],
})
export class PopupComponent {
    @Input() isVisible: boolean = false;
    @Output() isVisibleChange = new EventEmitter<boolean>();
    private readonly popupService: PopupService = inject(PopupService);

    selectedTab: 'chat' | 'journal' = 'chat';

    constructor() {}

    togglePopup(): void {
        this.isVisible = !this.isVisible;
        this.isVisibleChange.emit(this.isVisible);
        this.popupService.setPopupVisible(this.isVisible);
    }

    selectTab(tab: 'chat' | 'journal'): void {
        this.selectedTab = tab;
    }

    openPopup(): void {
        this.isVisible = true;
        this.isVisibleChange.emit(this.isVisible);
        this.popupService.setPopupVisible(true);
    }

    closePopup(): void {
        this.isVisible = false;
        this.isVisibleChange.emit(this.isVisible);
        this.popupService.setPopupVisible(false);
    }
}
