import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PersonListComponent } from './person-list.component';
import { PersonService } from '../../../core/services/person.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Person } from '../../../core/models/person.model';
import { PageResponse } from '../../../core/models/page-response.model';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

describe('PersonListComponent', () => {
  let component: PersonListComponent;
  let fixture: ComponentFixture<PersonListComponent>;
  let personServiceSpy: jasmine.SpyObj<PersonService>;

  const mockPersons: Person[] = [
    { 
      id: '1', 
      name: 'John Doe', 
      email: 'john@example.com', 
      cpf: '12345678901',
      formattedCpf: '123.456.789-01',
      nationality: 'BRA',
      nationalityName: 'Brasil',
      nationalityFlag: '🇧🇷',
      gender: 'M',
      genderDisplay: 'Masculino'
    },
    { 
      id: '2', 
      name: 'Jane Doe', 
      email: 'jane@example.com', 
      cpf: '98765432109',
      formattedCpf: '987.654.321-09',
      nationality: 'USA',
      nationalityName: 'Estados Unidos',
      nationalityFlag: '🇺🇸',
      passport: 'AB1234567',
      gender: 'F',
      genderDisplay: 'Feminino'
    }
  ];

  const mockPageResponse: PageResponse<Person> = {
    content: mockPersons,
    pageNumber: 0,
    pageSize: 10,
    totalElements: 2,
    totalPages: 1,
    last: true
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('PersonService', [
      'getAllPaged', 'searchByNamePaged', 'delete', 'clearCache'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        RouterTestingModule,
        PersonListComponent
      ],
      providers: [
        { provide: PersonService, useValue: spy }
      ]
    }).compileComponents();

    personServiceSpy = TestBed.inject(PersonService) as jasmine.SpyObj<PersonService>;
  });

  beforeEach(() => {
    personServiceSpy.getAllPaged.and.returnValue(of(mockPageResponse));
    fixture = TestBed.createComponent(PersonListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load persons on init', () => {
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(0, 10, 'name', 'ASC');
    expect(component.persons).toEqual(mockPersons);
    expect(component.currentPage).toBe(0);
    expect(component.totalPages).toBe(1);
    expect(component.totalElements).toBe(2);
  });

  it('should handle error when loading persons', () => {
    personServiceSpy.getAllPaged.and.returnValue(throwError(() => new Error('Error loading persons')));
    
    console.error = jasmine.createSpy('error');
    component.loadPersonsPaged();
    
    expect(console.error).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should search persons by name', () => {
    const searchResponse: PageResponse<Person> = {
      content: [mockPersons[0]],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true
    };
    
    personServiceSpy.searchByNamePaged.and.returnValue(of(searchResponse));
    
    component.searchTerm = 'John';
    component.searchPersons();
    
    expect(personServiceSpy.searchByNamePaged).toHaveBeenCalledWith('John', 0, 10, 'name', 'ASC');
    expect(component.persons).toEqual([mockPersons[0]]);
    expect(component.currentPage).toBe(0);
    expect(component.totalPages).toBe(1);
    expect(component.totalElements).toBe(1);
  });

  it('should reset search and load all persons', () => {
    component.searchTerm = 'John';
    component.resetSearch();
    
    expect(component.searchTerm).toBe('');
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledTimes(2); // Once on init, once on reset
  });

  it('should delete a person after confirmation', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    personServiceSpy.delete.and.returnValue(of(void 0));
    
    component.deletePerson('1');
    tick();
    
    expect(personServiceSpy.delete).toHaveBeenCalledWith('1');
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledTimes(2); // Once on init, once after delete
    expect(component.showToast).toBeTrue();
    expect(component.toastMessage).toContain('excluída com sucesso');
  }));

  it('should not delete a person if not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deletePerson('1');
    
    expect(personServiceSpy.delete).not.toHaveBeenCalled();
  });

  it('should clear cache', fakeAsync(() => {
    personServiceSpy.clearCache.and.returnValue(of(void 0));
    
    component.clearCache();
    tick();
    
    expect(personServiceSpy.clearCache).toHaveBeenCalled();
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledTimes(2); // Once on init, once after clear cache
    expect(component.showToast).toBeTrue();
    expect(component.toastMessage).toContain('Cache limpo com sucesso');
  }));

  it('should navigate to a specific page', () => {
    const page2Response: PageResponse<Person> = {
      content: [mockPersons[1]],
      pageNumber: 1,
      pageSize: 10,
      totalElements: 2,
      totalPages: 2,
      last: true
    };
    
    personServiceSpy.getAllPaged.and.returnValue(of(page2Response));
    
    component.goToPage(1);
    
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(1, 10, 'name', 'ASC');
    expect(component.currentPage).toBe(1);
  });

  it('should not navigate to an invalid page', () => {
    component.totalPages = 2;
    component.goToPage(-1);
    component.goToPage(2);
    
    // Should still be called only once from init
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledTimes(1);
  });

  it('should change page size', () => {
    const newSizeResponse: PageResponse<Person> = {
      content: mockPersons,
      pageNumber: 0,
      pageSize: 5,
      totalElements: 2,
      totalPages: 1,
      last: true
    };
    
    personServiceSpy.getAllPaged.and.returnValue(of(newSizeResponse));
    
    component.changePageSize(5);
    
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(0, 5, 'name', 'ASC');
    expect(component.pageSize).toBe(5);
    expect(component.currentPage).toBe(0); // Should reset to first page
  });

  it('should sort by column', () => {
    const sortedResponse: PageResponse<Person> = {
      content: mockPersons.slice().reverse(), // Reversed order
      pageNumber: 0,
      pageSize: 10,
      totalElements: 2,
      totalPages: 1,
      last: true
    };
    
    personServiceSpy.getAllPaged.and.returnValue(of(sortedResponse));
    
    // First click on column should sort ASC
    component.sort('email');
    
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(0, 10, 'email', 'ASC');
    expect(component.sortBy).toBe('email');
    expect(component.sortDirection).toBe('ASC');
    
    // Second click on same column should toggle to DESC
    personServiceSpy.getAllPaged.and.returnValue(of(sortedResponse));
    component.sort('email');
    
    expect(personServiceSpy.getAllPaged).toHaveBeenCalledWith(0, 10, 'email', 'DESC');
    expect(component.sortBy).toBe('email');
    expect(component.sortDirection).toBe('DESC');
  });

  it('should get correct page range', () => {
    // Test with small number of pages
    component.currentPage = 0;
    component.totalPages = 3;
    
    let range = component.getPageRange();
    expect(range).toEqual([0, 1, 2]);
    
    // Test with current page in middle
    component.currentPage = 5;
    component.totalPages = 10;
    
    range = component.getPageRange();
    expect(range.length).toBe(5);
    expect(range).toContain(5); // Should contain current page
    
    // Test with current page near end
    component.currentPage = 8;
    component.totalPages = 10;
    
    range = component.getPageRange();
    expect(range.length).toBe(5);
    expect(range).toContain(8); // Should contain current page
    expect(range[range.length - 1]).toBe(9); // Should end with last page
  });

  it('should search when pressing enter in search input', () => {
    spyOn(component, 'searchPersons');
    
    const searchInput = fixture.debugElement.query(By.css('input[placeholder="Buscar por nome..."]'));
    searchInput.triggerEventHandler('keyup.enter', {});
    
    expect(component.searchPersons).toHaveBeenCalled();
  });

  it('should display formatted CPF in the table', () => {
    fixture.detectChanges();
    const tableRows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(tableRows.length).toBe(2);
    
    const cpfCells = fixture.debugElement.queryAll(By.css('tbody tr td:nth-child(3)'));
    expect(cpfCells[0].nativeElement.textContent).toContain('123.456.789-01');
    expect(cpfCells[1].nativeElement.textContent).toContain('987.654.321-09');
  });

  it('should display nationality with flag in the table', () => {
    fixture.detectChanges();
    const nationalityCells = fixture.debugElement.queryAll(By.css('tbody tr td:nth-child(4)'));
    expect(nationalityCells[0].nativeElement.textContent).toContain('🇧🇷');
    expect(nationalityCells[0].nativeElement.textContent).toContain('Brasil');
    expect(nationalityCells[1].nativeElement.textContent).toContain('🇺🇸');
    expect(nationalityCells[1].nativeElement.textContent).toContain('Estados Unidos');
  });

  it('should display gender in the table', () => {
    fixture.detectChanges();
    const genderCells = fixture.debugElement.queryAll(By.css('tbody tr td:nth-child(5)'));
    expect(genderCells[0].nativeElement.textContent).toContain('Masculino');
    expect(genderCells[1].nativeElement.textContent).toContain('Feminino');
  });
});