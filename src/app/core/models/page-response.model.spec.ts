import { PageResponse } from './page-response.model';
import { Person } from './person.model';

describe('PageResponse', () => {
  it('should create an instance with all properties', () => {
    const mockPerson: Person = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      birthDate: '1990-01-01'
    };
    
    const pageResponse: PageResponse<Person> = {
      content: [mockPerson],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true
    };
    
    expect(pageResponse).toBeTruthy();
    expect(pageResponse.content.length).toBe(1);
    expect(pageResponse.content[0].name).toBe('John Doe');
    expect(pageResponse.pageNumber).toBe(0);
    expect(pageResponse.pageSize).toBe(10);
    expect(pageResponse.totalElements).toBe(1);
    expect(pageResponse.totalPages).toBe(1);
    expect(pageResponse.last).toBe(true);
  });
});