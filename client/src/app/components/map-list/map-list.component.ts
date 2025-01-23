import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ViewportRuler } from '@angular/cdk/overlay';




export interface Map {
    id: number;
    title: string;
    description: string;
    date: Date;
    category: string;
    status: string;
    image: string;
}

@Component({
    selector: 'app-map-list',
    templateUrl: './map-list.component.html',
    styleUrls: ['./map-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule, ScrollingModule],
})
export class MapListComponent implements OnInit {
    constructor(
        private viewportRuler: ViewportRuler,
    ) {}

    ngOnInit() {
        setTimeout(() => {
            this.viewportRuler.change(1); // Force recalculation of viewport size
        }, 0);
    }

    items: Map[] = [
        {
            id: 1,
            title: "Grandpa's Last Stand",
            description: "Defend Grandpa's farm from zombie chickens armed with pitchforks. It's his final wish.",
            date: new Date(2025, 0, 1),
            category: 'rpg',
            status: 'Visible',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9pvSGI4Bv4mp6AhtsAtEyYwDGz7MT_KxD2g&s',
        },
        {
            id: 2,
            title: 'Tech Bro Utopia',
            description: 'A city powered by NFTs and broken dreams. Survive the chaos of blockchain overlords.',
            date: new Date(2025, 0, 15),
            category: 'development',
            status: 'Non-visible',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsVj4QHuxsJq3enpNmB6iDCfo0U_ePAcO33w&s',
        },
        {
            id: 3,
            title: 'Doomed Suburbia',
            description: 'A quiet suburb where everyone smiles… until 8 p.m., when the “incident” happens.',
            date: new Date(2025, 0, 20),
            category: 'rpg',
            status: 'Visible',
            image: 'https://images.unsplash.com/photo-1603289609266-d966e23481f4',
        },
        {
            id: 4,
            title: 'Flat Earth Cruise',
            description: "A luxury cruise to the edge of the Earth. Spoiler: It doesn't end well",
            date: new Date(2025, 0, 25),
            category: 'sci-fi',
            status: 'Visible',
            image: 'https://images.unsplash.com/photo-1517816821811-8f276628df67',
        },
        {
            id: 5,
            title: 'Karenpocalypse',
            description: 'The world has fallen, and Karens rule with iron haircuts. Survive their endless complaints.',
            date: new Date(2025, 0, 30),
            category: 'horror',
            status: 'Non-visible',
            image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0',
        },
        {
            id: 6,
            title: 'Corporate Hellscape',
            description: 'Climb the corporate ladder or die trying. Beware of the intern uprising on Floor 7.',
            date: new Date(2025, 1, 5),
            category: 'adventure',
            status: 'Visible',
            image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        },
        {
            id: 7,
            title: 'The Catastrophe Court',
            description: 'A courtroom where cats are the judges. Good luck defending yourself against their meows.',
            date: new Date(2025, 1, 10),
            category: 'strategy',
            status: 'Non-visible',
            image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc',
        },
        {
            id: 8,
            title: 'Atlantis Wi-Fi Wars',
            description: "Fight for the last working router in Atlantis. The mermaids aren't playing fair.",
            date: new Date(2025, 1, 15),
            category: 'fantasy',
            status: 'Visible',
            image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
        },
        {
            id: 1,
            title: "Grandpa's Last Stand",
            description: "Defend Grandpa's farm from zombie chickens armed with pitchforks. It's his final wish.",
            date: new Date(2025, 0, 1),
            category: 'rpg',
            status: 'Visible',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9pvSGI4Bv4mp6AhtsAtEyYwDGz7MT_KxD2g&s',
        },
        {
            id: 2,
            title: 'Tech Bro Utopia',
            description: 'A city powered by NFTs and broken dreams. Survive the chaos of blockchain overlords.',
            date: new Date(2025, 0, 15),
            category: 'development',
            status: 'Non-visible',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsVj4QHuxsJq3enpNmB6iDCfo0U_ePAcO33w&s',
        },
        {
            id: 3,
            title: 'Doomed Suburbia',
            description: 'A quiet suburb where everyone smiles… until 8 p.m., when the “incident” happens.',
            date: new Date(2025, 0, 20),
            category: 'rpg',
            status: 'Visible',
            image: 'https://images.unsplash.com/photo-1603289609266-d966e23481f4',
        },
        {
            id: 4,
            title: 'Flat Earth Cruise',
            description: "A luxury cruise to the edge of the Earth. Spoiler: It doesn't end well",
            date: new Date(2025, 0, 25),
            category: 'sci-fi',
            status: 'Visible',
            image: 'https://images.unsplash.com/photo-1517816821811-8f276628df67',
        },
        {
            id: 5,
            title: 'Karenpocalypse',
            description: 'The world has fallen, and Karens rule with iron haircuts. Survive their endless complaints.',
            date: new Date(2025, 0, 30),
            category: 'horror',
            status: 'Non-visible',
            image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0',
        },
        {
            id: 6,
            title: 'Corporate Hellscape',
            description: 'Climb the corporate ladder or die trying. Beware of the intern uprising on Floor 7.',
            date: new Date(2025, 1, 5),
            category: 'adventure',
            status: 'Visible',
            image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        },
        {
            id: 7,
            title: 'The Catastrophe Court',
            description: 'A courtroom where cats are the judges. Good luck defending yourself against their meows.',
            date: new Date(2025, 1, 10),
            category: 'strategy',
            status: 'Non-visible',
            image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc',
        },
        {
            id: 8,
            title: 'Atlantis Wi-Fi Wars',
            description: "Fight for the last working router in Atlantis. The mermaids aren't playing fair.",
            date: new Date(2025, 1, 15),
            category: 'fantasy',
            status: 'Visible',
            image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
        },
    ];

    searchQuery: string = '';
    sortBy: string = 'date';

    getFilteredAndSortedItems(): Map[] {
        let filtered = this.items.filter(
            (item) =>
                item.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(this.searchQuery.toLowerCase()),
        );

        return filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'date':
                    return b.date.getTime() - a.date.getTime();
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });
    }

    onEdit(item: Map) {
        console.log('Edit item:', item);
    }

    onDelete(item: Map) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.items = this.items.filter((i) => i.id !== item.id);
        }
    }

    handleImageError(event: any) {
        event.target.src = 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba';
    }
}
