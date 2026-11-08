import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppLayoutComponent } from './app-layout';

describe('AppLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app layout', () => {
    const fixture = TestBed.createComponent(AppLayoutComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
