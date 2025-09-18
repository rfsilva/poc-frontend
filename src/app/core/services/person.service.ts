import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Person } from '../models/person.model';
import { PageResponse } from '../models/page-response.model';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private apiUrl = 'http://localhost:8080/api/persons';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Person[]> {
    return this.http.get<Person[]>(this.apiUrl);
  }

  getAllPaged(page: number = 0, size: number = 10, sortBy: string = 'name', direction: string = 'ASC'): Observable<PageResponse<Person>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
    
    return this.http.get<PageResponse<Person>>(`${this.apiUrl}/paged`, { params });
  }

  getById(id: string): Observable<Person> {
    return this.http.get<Person>(`${this.apiUrl}/${id}`);
  }

  create(person: Person): Observable<Person> {
    return this.http.post<Person>(this.apiUrl, person);
  }

  update(id: string, person: Person): Observable<Person> {
    return this.http.put<Person>(`${this.apiUrl}/${id}`, person);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchByName(name: string): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.apiUrl}/search?name=${name}`);
  }

  searchByNamePaged(name: string, page: number = 0, size: number = 10, sortBy: string = 'name', direction: string = 'ASC'): Observable<PageResponse<Person>> {
    let params = new HttpParams()
      .set('name', name)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
    
    return this.http.get<PageResponse<Person>>(`${this.apiUrl}/search/paged`, { params });
  }

  clearCache(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cache/clear`);
  }
}