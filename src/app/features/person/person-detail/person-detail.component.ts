import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PersonService } from '../../../core/services/person.service';
import { Person } from '../../../core/models/person.model';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './person-detail.component.html',
  styleUrls: ['./person-detail.component.scss']
})
export class PersonDetailComponent implements OnInit {
  person: Person | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personService: PersonService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.router.navigate(['/persons']);
      return;
    }
    
    this.personService.getById(id).subscribe({
      next: (data) => {
        this.person = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching person details', error);
        this.loading = false;
      }
    });
  }
}