import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormDialogComponent } from '@app/components/form-dialog/form-dialog.component';
import { MapService } from '@app/services/map.service';
import { Visibility } from '@common/enums';
import { environment } from 'src/environments/environment';
import { Board } from '@common/board';

@Component({
    selector: 'app-map-list',
    templateUrl: './map-list.component.html',
    styleUrls: ['./map-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule, ScrollingModule],
})
export class MapListComponent implements OnInit {
    @Input() items: Board[] = [];
    @Input() showActions: boolean = true;
    @Input() onlyVisible: boolean = false;
    @Output() divClicked = new EventEmitter<void>();
    searchQuery: string = '';
    sortBy: string = 'createdAt';

    private mapService = inject(MapService);

    private readonly baseUrl: string = environment.serverUrl;

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
        private readonly cdr: ChangeDetectorRef,
        private readonly dialog: MatDialog,
    ) {}

    onDivClick() {
        this.divClicked.emit();
    }

    ngOnInit(): void {
        this.http.get<Board[]>('assets/mockMapData.json').subscribe({
            next: (data) => {
                this.items = data.map((item) => ({
                    ...item,
                    visibility: item.visibility === 'Public' ? Visibility.PUBLIC : Visibility.PRIVATE,
                    createdAt: item.createdAt ? new Date(item.createdAt) : null,
                    updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
                }));
                this.cdr.detectChanges(); // Manually trigger change detection
            },
        });
    }

    getFilteredAndSortedItems(): Board[] {
        let filtered = this.items.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(this.searchQuery.toLowerCase());

            const isPublished = this.showActions;

            return matchesSearch && isPublished;
        });

        if (this.onlyVisible) {
            filtered = filtered.filter((item) => item.visibility === 'Public');
        }

        return filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'createdAt':
                    return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'size':
                    return b.size - a.size;
                default:
                    return 0;
            }
        });
    }

    onEdit(map: Board): void {
        this.http.get<Board>(`${this.baseUrl}/board/${map.name}`).subscribe((fullMap) => {
            this.mapService.setMapData(fullMap);
            this.router.navigate(['/edit']);
        });
    }

    onDelete(map: Board): void {
        if (confirm(`Are you sure you want to delete "${map.name}"?`)) {
            this.items = this.items.filter((item) => item._id !== map._id);
            this.cdr.detectChanges();
        }
    }

    toggleVisibility(map: Board): void {
        map.visibility = map.visibility === Visibility.PUBLIC ? Visibility.PRIVATE : Visibility.PUBLIC;
        this.cdr.detectChanges();
    }

    createNewMap(): void {
        const dialogRef = this.dialog.open(FormDialogComponent, {
            width: '280px',
            data: { name: '', description: '', size: 10, isCTF: false },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.mapService.setMapData(result);
                this.router.navigate(['/edit']);
            }
        });
    }

    handleImageError(event: Event): void {
        const target = event.target as HTMLImageElement;
        target.src = 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba';
    }
}
