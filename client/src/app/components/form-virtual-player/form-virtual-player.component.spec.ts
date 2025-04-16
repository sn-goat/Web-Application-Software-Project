import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { VirtualPlayerStyles } from '@common/player';
import { FormVirtualPlayerComponent } from './form-virtual-player.component';

describe('FormVirtualPlayerComponent', () => {
    let component: FormVirtualPlayerComponent;
    let fixture: ComponentFixture<FormVirtualPlayerComponent>;
    let socketEmitterSpy: jasmine.SpyObj<SocketEmitterService>;

    beforeEach(async () => {
        socketEmitterSpy = jasmine.createSpyObj('SocketEmitterService', ['createVirtualPlayer']);

        await TestBed.configureTestingModule({
            imports: [FormVirtualPlayerComponent, MatDialogModule, FormsModule],
            providers: [
                { provide: SocketEmitterService, useValue: socketEmitterSpy },
                { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FormVirtualPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with null virtualPlayerStyle', () => {
        expect(component.virtualPlayerStyle).toBeNull();
    });

    it('should set virtualPlayerStyle to Aggressive when clicking on Aggressive item', () => {
        const aggressiveItem = fixture.debugElement.query(By.css('.item:first-child'));
        aggressiveItem.triggerEventHandler('click', null);
        expect(component.virtualPlayerStyle).toBe(VirtualPlayerStyles.Aggressive);
        fixture.detectChanges();
        expect(aggressiveItem.nativeElement.classList).toContain('selected');
    });

    it('should set virtualPlayerStyle to Defensive when clicking on Defensive item', () => {
        const defensiveItem = fixture.debugElement.query(By.css('.item:last-child'));
        defensiveItem.triggerEventHandler('click', null);
        expect(component.virtualPlayerStyle).toBe(VirtualPlayerStyles.Defensive);
        fixture.detectChanges();
        expect(defensiveItem.nativeElement.classList).toContain('selected');
    });

    it('should call socketEmitter.createVirtualPlayer with Aggressive style when createVirtualPlayer is called', () => {
        component.virtualPlayerStyle = VirtualPlayerStyles.Aggressive;
        component.createVirtualPlayer();
        expect(socketEmitterSpy.createVirtualPlayer).toHaveBeenCalledWith(VirtualPlayerStyles.Aggressive);
    });

    it('should call socketEmitter.createVirtualPlayer with Defensive style when createVirtualPlayer is called', () => {
        component.virtualPlayerStyle = VirtualPlayerStyles.Defensive;
        component.createVirtualPlayer();
        expect(socketEmitterSpy.createVirtualPlayer).toHaveBeenCalledWith(VirtualPlayerStyles.Defensive);
    });

    it('should not call socketEmitter.createVirtualPlayer when virtualPlayerStyle is null', () => {
        component.virtualPlayerStyle = null;
        component.createVirtualPlayer();
        expect(socketEmitterSpy.createVirtualPlayer).not.toHaveBeenCalled();
    });

    it('should have the Create button disabled when no style is selected', () => {
        component.virtualPlayerStyle = null;
        fixture.detectChanges();
        const createButton = fixture.debugElement.query(By.css('button:last-child'));
        expect(createButton.nativeElement.disabled).toBeTrue();
    });

    it('should have the Create button enabled when a style is selected', () => {
        component.virtualPlayerStyle = VirtualPlayerStyles.Aggressive;
        fixture.detectChanges();
        const createButton = fixture.debugElement.query(By.css('button:last-child'));
        expect(createButton.nativeElement.disabled).toBeFalse();
    });
});
