import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { VirtualPlayerStyles } from '@common/player';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';

@Component({
    selector: 'app-form-virtual-player',
    imports: [MatDialogModule, MatButtonModule, MatButtonToggleModule, FormsModule],
    templateUrl: './form-virtual-player.component.html',
    styleUrl: './form-virtual-player.component.scss',
})
export class FormVirtualPlayerComponent {
    readonly virtualPlayerStyles = VirtualPlayerStyles;
    virtualPlayerStyle: VirtualPlayerStyles = VirtualPlayerStyles.Aggressive;
    private readonly socketEmitter: SocketEmitterService = inject(SocketEmitterService);

    createVirtualPlayer() {
        this.socketEmitter.createVirtualPlayer(this.virtualPlayerStyle);
    }
}
