import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {

  private fragment: string | undefined;

  constructor(private router: Router, private route: ActivatedRoute) {


  }

  ngOnInit() {
    this.route.fragment.subscribe(fragment => { 
      if (!fragment) return;
      this.fragment = fragment;
      this.navigate();
    });
  }

  navigate() {
    if (this.fragment) 
      document.getElementById(this.fragment)?.scrollIntoView({behavior: 'smooth'});
  }

  select(event: MouseEvent) {
    this.router.navigate([], { relativeTo: this.route, fragment: (event.target as Element).id} );
  }

  selectTag(tag: string) {
    if (tag === this.fragment)
      this.navigate();
    else
      this.router.navigate([], { relativeTo: this.route, fragment: tag });
  }
}
