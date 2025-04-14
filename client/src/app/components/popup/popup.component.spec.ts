import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from '@app/components/chat/chat.component';
import { JournalComponent } from '@app/components/journal/journal.component';
import { PopupService } from '@app/services/popup/popup.service';
import { PopupComponent } from './popup.component';

describe('PopupComponent', () => {
    let component: PopupComponent;
    let fixture: ComponentFixture<PopupComponent>;
    let popupServiceMock: jasmine.SpyObj<PopupService>;

    beforeEach(async () => {
        // Create spy for PopupService
        popupServiceMock = jasmine.createSpyObj('PopupService', ['setPopupVisible']);

        await TestBed.configureTestingModule({
            // Import the component being tested
            imports: [PopupComponent],
            // Provide mock for ChatComponent and JournalComponent to avoid their implementations
            providers: [{ provide: PopupService, useValue: popupServiceMock }],
        })
            // Override the components that PopupComponent imports to avoid having to set up their dependencies
            .overrideComponent(PopupComponent, {
                remove: { imports: [ChatComponent, JournalComponent] },
                add: { imports: [] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(PopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.isVisible).toBeFalse();
        expect(component.selectedTab).toBe('chat');
    });

    it('should toggle popup visibility', () => {
        // Initial state is false
        expect(component.isVisible).toBeFalse();

        // Call the toggle method
        component.togglePopup();

        // Should be toggled to true
        expect(component.isVisible).toBeTrue();
        expect(popupServiceMock.setPopupVisible).toHaveBeenCalledWith(true);

        // Call toggle again
        component.togglePopup();

        // Should be toggled back to false
        expect(component.isVisible).toBeFalse();
        expect(popupServiceMock.setPopupVisible).toHaveBeenCalledWith(false);
    });

    it('should emit isVisibleChange when toggling popup', () => {
        // Spy on the output event
        spyOn(component.isVisibleChange, 'emit');

        // Call the toggle method
        component.togglePopup();

        // Verify the event was emitted with the correct value
        expect(component.isVisibleChange.emit).toHaveBeenCalledWith(true);

        // Toggle again
        component.togglePopup();

        // Verify the event was emitted with the new value
        expect(component.isVisibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should select tab correctly', () => {
        // Default is 'chat'
        expect(component.selectedTab).toBe('chat');

        // Select 'journal' tab
        component.selectTab('journal');

        // Should update the selected tab
        expect(component.selectedTab).toBe('journal');

        // Select 'chat' tab again
        component.selectTab('chat');

        // Should update back to 'chat'
        expect(component.selectedTab).toBe('chat');
    });

    it('should open popup', () => {
        // Initial state
        component.isVisible = false;

        // Spy on the output event
        spyOn(component.isVisibleChange, 'emit');

        // Call open method
        component.openPopup();

        // Verify popup is opened
        expect(component.isVisible).toBeTrue();
        expect(component.isVisibleChange.emit).toHaveBeenCalledWith(true);
        expect(popupServiceMock.setPopupVisible).toHaveBeenCalledWith(true);
    });

    it('should close popup', () => {
        // Set initial state to open
        component.isVisible = true;

        // Spy on the output event
        spyOn(component.isVisibleChange, 'emit');

        // Call close method
        component.closePopup();

        // Verify popup is closed
        expect(component.isVisible).toBeFalse();
        expect(component.isVisibleChange.emit).toHaveBeenCalledWith(false);
        expect(popupServiceMock.setPopupVisible).toHaveBeenCalledWith(false);
    });

    it('should respect input binding for isVisible', () => {
        // Set input value
        component.isVisible = true;
        fixture.detectChanges();

        // Verify the component reflects the input
        expect(component.isVisible).toBeTrue();

        // Change input again
        component.isVisible = false;
        fixture.detectChanges();

        // Verify the change is reflected
        expect(component.isVisible).toBeFalse();
    });
});
