import { Component, OnInit, Type, Input, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { TableCellCustom } from '../../table/table-cell/table-cell-custom';
import { CardAppVariableComponent } from '../custom-cards/card-app-variable/card-app-variable.component';
import { CardEventComponent } from '../custom-cards/card-app-event/card-app-event.component';
import { IListDataSource } from '../../../data-sources/list-data-source';
import { CardAppComponent } from '../custom-cards/card-app/card-app.component';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  entryComponents: [
    CardEventComponent,
    CardAppVariableComponent,
    CardAppComponent,
  ]
})
export class CardComponent<T> implements OnInit {

  @Input('component') component: Type<{}>;
  @Input('item') item: T;
  @Input('dataSource') dataSource = null as IListDataSource<T>;

  @ViewChild('target', { read: ViewContainerRef }) target;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    if (!this.component) {
      return;
    }
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);
    // Add to target to ensure ngcontent is correct in new component
    const componentRef = this.target.createComponent(componentFactory);
    const cardComponent = <TableCellCustom<T>>componentRef.instance;
    cardComponent.row = this.item;
    cardComponent.dataSource = this.dataSource;
  }

}
