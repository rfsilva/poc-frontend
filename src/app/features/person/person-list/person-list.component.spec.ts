import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PersonListComponent } from './person-list.component';
import { PersonService } from '../../../core/services/person.service';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { PageResponse } from '../../../core/models/page-response.model';
import { Person } from '../../../core/models/person.model';

describe('PersonListComponent', () => {
  let component: PersonListComponent;
  let fixture: ComponentFixture<PersonListComponent>;
  let personServiceSpy: jasmine.SpyObj<PersonService>;

  const mockPageResponse: PageResponse<Person> = {
    content: [
      { 
        id: '1', 
        name: 'John Doe', 
        email: 'john@example.com', 
        nationality: 'USA',
        formattedCpf: '123.456.789-09',
        nationalityName: 'United States',
        nationalityFlag: '🇺🇸',
        genderDisplay: 'Male',
        gender: 'M'
      }
    ],
    pageNumber: 0,
    pageSize: 10,
    totalElements: 1,
    totalPages: 1,
    last: true
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('PersonService', [
      'getAllPaged', 
      'filterPersons', 
      'clearCache', 
      'delete'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        RouterTestingModule,
        PersonListComponent
      ],
      providers: [
        { provide: PersonService, useValue: spy }
      ]
    }).compileComponents();

    personServiceSpy = TestBed.inject(PersonService) as jasmine.SpyObj<PersonService>;
    personServiceSpy.getAllPaged.and.returnValue(of(mockPageResponse));
    personServiceSpy.filterPersons.and.returnValue(of(mockPageResponse));
    personServiceSpy.clearCache.and.returnValue(of(undefined));
    personServiceSpy.delete.and.returnValue(of(undefined));

    fixture = TestBed.createComponent(PersonListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load persons on init', () => {
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(0, 10, 'name', 'ASC');
    expect(component.persons).toEqual(mockPageResponse.content);
    expect(component.totalElements).toBe(1);
    expect(component.totalPages).toBe(1);
  });

  it('should toggle filter visibility', () => {
    expect(component.showFilter).toBeFalse();
    component.toggleFilterVisibility();
    expect(component.showFilter).toBeTrue();
    component.toggleFilterVisibility();
    expect(component.showFilter).toBeFalse();
  });

  it('should apply filters', fakeAsync(() => {
    // Set filters
    component.filters = {
      name: 'John',
      email: 'john@example.com',
      cpf: '',
      passport: '',
      gender: 'M'
    };

    // Apply filters
    component.applyFilters();
    tick();

    // Verify service was called with correct parameters
    expect(personServiceSpy.filterPersons).toHaveBeenCalledWith(
      { name: 'John', email: 'john@example.com', gender: 'M' },
      0,
      10,
      'name',
      'ASC'
    );

    // Verify component state
    expect(component.persons).toEqual(mockPageResponse.content);
    expect(component.showFilter).toBeFalse();
  }));

  it('should reset filters', fakeAsync(() => {
    // Set filters
    component.filters = {
      name: 'John',
      email: 'john@example.com',
      cpf: '12345678901',
      passport: 'AB123456',
      gender: 'M'
    };

    // Reset filters
    component.resetFilters();
    tick();

    // Verify filters are cleared
    expect(component.filters).toEqual({
      name: '',
      email: '',
      cpf: '',
      passport: '',
      gender: ''
    });

    // Verify service was called to reload data
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(0, 10, 'name', 'ASC');
  }));

  it('should detect active filters', () => {
    // No active filters
    component.filters = {
      name: '',
      email: '',
      cpf: '',
      passport: '',
      gender: ''
    };
    expect(component.hasActiveFilters()).toBeFalse();

    // With active filters
    component.filters = {
      name: 'John',
      email: '',
      cpf: '',
      passport: '',
      gender: ''
    };
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should get active filters', () => {
    // Set filters with some empty values
    component.filters = {
      name: 'John',
      email: 'john@example.com',
      cpf: '',
      passport: '',
      gender: 'M'
    };

    // Get active filters
    const activeFilters = component.getActiveFilters();

    // Verify only non-empty filters are returned
    expect(activeFilters).toEqual({
      name: 'John',
      email: 'john@example.com',
      gender: 'M'
    });
  });

  it('should change page size', fakeAsync(() => {
    component.changePageSize(20);
    tick();

    expect(component.pageSize).toBe(20);
    expect(component.currentPage).toBe(0);
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(0, 20, 'name', 'ASC');
  }));

  it('should change sort order', fakeAsync(() => {
    // First click on same column - should toggle direction
    component.sortBy = 'name';
    component.sortDirection = 'ASC';
    component.sort('name');
    tick();

    expect(component.sortBy).toBe('name');
    expect(component.sortDirection).toBe('DESC');
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(0, 10, 'name', 'DESC');

    // Click on different column - should set to ASC
    component.sort('email');
    tick();

    expect(component.sortBy).toBe('email');
    expect(component.sortDirection).toBe('ASC');
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(0, 10, 'email', 'ASC');
  }));

  it('should clear cache', fakeAsync(() => {
    component.clearCache();
    tick();

    expect(personServiceSpy.clearCache).toHaveBeenCalled();
    expect(personServiceSpy.getAllPaged).toHaveBeenCalled();
    expect(component.showToast).toBeTrue();
  }));

  it('should delete person', fakeAsync(() => {
    // Mock confirm to return true
    spyOn(window, 'confirm').and.returnValue(true);

    component.deletePerson('1');
    tick();

    expect(personServiceSpy.delete).toHaveBeenCalledWith('1');
    expect(personServiceSpy.getAllPaged).toHaveBeenCalled();
    expect(component.showToast).toBeTrue();
  }));

  it('should not delete person if not confirmed', fakeAsync(() => {
    // Mock confirm to return false
    spyOn(window, 'confirm').and.returnValue(false);

    component.deletePerson('1');
    tick();

    expect(personServiceSpy.delete).not.toHaveBeenCalled();
  }));

  it('should navigate between pages', fakeAsync(() => {
    // Mock multiple pages
    const multiPageResponse: PageResponse<Person> = {
      ...mockPageResponse,
      totalPages: 3,
      totalElements: 30,
      pageNumber: 1,
      last: false
    };
    personServiceSpy.getAllPaged.and.returnValue(of(multiPageResponse));

    // Go to page 2
    component.goToPage(2);
    tick();

    expect(component.currentPage).toBe(2);
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(2, 10, 'name', 'ASC');
  }));

  it('should not navigate to invalid pages', fakeAsync(() => {
    // Set up component with multiple pages
    component.totalPages = 3;
    component.currentPage = 1;

    // Try to go to negative page
    component.goToPage(-1);
    tick();

    // Current page should not change
    expect(component.currentPage).toBe(1);
    
    // Try to go to page beyond total
    component.goToPage(3);
    tick();

    // Current page should not change
    expect(component.currentPage).toBe(1);
  }));

  it('should generate correct page range', () => {
    // Set up component with multiple pages
    component.totalPages = 10;
    component.currentPage = 5;

    const range = component.getPageRange();
    
    // Should show 5 pages centered around current page
    expect(range).toEqual([3, 4, 5, 6, 7]);
    
    // Test at beginning
    component.currentPage = 1;
    expect(component.getPageRange()).toEqual([0, 1, 2, 3, 4]);
    
    // Test at end
    component.currentPage = 8;
    expect(component.getPageRange()).toEqual([5, 6, 7, 8, 9]);
  });
});