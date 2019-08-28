import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { MenuComponent } from '../po/menu.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { SnackBarPo } from '../po/snackbar.po';
import { EndpointsPage } from './endpoints.po';

describe('Endpoints', () => {
  const endpointsPage = new EndpointsPage();

  describe('Workflow on log in (admin/non-admin + no endpoints/some endpoints) -', () => {
    describe('As Admin -', () => {

      describe('No registered endpoints', () => {
        beforeAll(() => {
          e2e.setup(ConsoleUserType.admin)
            .clearAllEndpoints();
        });

        it('Should reach endpoints dashboard after log in', () => {
          expect(endpointsPage.isActivePage()).toBeTruthy();
          expect(endpointsPage.isWelcomeMessageAdmin()).toBeTruthy();
          expect(endpointsPage.list.isPresent()).toBeFalsy();
        });

        it('should show register button', () => {
          expect(endpointsPage.header.hasIconButton('add')).toBeTruthy();
        });

      });

      describe('Some registered endpoints', () => {
        beforeAll(() => {
          e2e.setup(ConsoleUserType.admin)
            .clearAllEndpoints()
            .registerDefaultCloudFoundry();
        });

        it('Should reach endpoint dashboard after log in', () => {
          expect(endpointsPage.isActivePage()).toBeTruthy();
        });

        it('No CF side nav when no CF connected', () => {
          expect(endpointsPage.sideNav.isMenuItemPresent(SideNavMenuItem.CloudFoundry)).toBeFalsy();
        });

        it('Welcome snackbar message should be displayed', () => {
          endpointsPage.sideNav.goto(SideNavMenuItem.Endpoints);
          const snackBar = new SnackBarPo();
          expect(snackBar.isDisplayed()).toBeTruthy();
          expect(endpointsPage.isNoneConnectedSnackBar(snackBar)).toBeTruthy();
          snackBar.close();
        });
      });
    });

    describe('As Non-Admin -', () => {

      describe('No registered endpoints -', () => {
        beforeAll(() => {
          e2e.setup(ConsoleUserType.user)
            .clearAllEndpoints();
        });

        it('Should not display endpoint dashboard', () => {
          expect(endpointsPage.isNonAdminNoEndpointsPage()).toBeTruthy();
          expect(endpointsPage.isWelcomeMessageNonAdmin()).toBeTruthy();
        });
      });

      describe('Some registered endpoints -', () => {

        beforeAll(() => {
          e2e.setup(ConsoleUserType.user)
            .clearAllEndpoints()
            .registerDefaultCloudFoundry();
        });

        describe('endpoints table -', () => {
          it('should be displayed', () => {
            expect(endpointsPage.isActivePage()).toBeTruthy();
          });

          it('should not show register button', () => {
            expect(endpointsPage.header.hasIconButton('add')).toBeFalsy();
          });

          it('should show at least one endpoint', () => {
            expect(endpointsPage.list.isDisplayed).toBeTruthy();
            expect(endpointsPage.list.isCardsView()).toBeTruthy();
            expect(endpointsPage.list.cards.getCardCount()).toBe(1);
          });

          it('should show correct cards content', () => {
            const cf = e2e.secrets.getDefaultCFEndpoint().name;
            return endpointsPage.cards.getEndpointDataForEndpoint(cf).then(ep => {
              const endpointConfig = e2e.secrets.getEndpointByName(ep.name);
              expect(endpointConfig).not.toBeNull();
              expect(endpointConfig.url).toEqual(ep.url);
              expect(endpointConfig.typeLabel).toEqual(ep.type);

              return endpointsPage.cards.findCardByTitle(ep.name).then(card => {
                card.openActionMenu();
                const menu = new MenuComponent();
                menu.waitUntilShown();
                menu.getItemMap().then(items => {
                  expect(items.connect).toBeDefined();
                  expect(items.disconnect).not.toBeDefined();
                });
                return menu.close();
              });
            });
          });

          it('Welcome snackbar message should be displayed', () => {
            endpointsPage.sideNav.goto(SideNavMenuItem.Endpoints);
            const snackBar = new SnackBarPo();
            expect(snackBar.isDisplayed()).toBeTruthy();
            expect(endpointsPage.isNoneConnectedSnackBar(snackBar)).toBeTruthy();
            snackBar.close();
          });
        });
      });
    });
  });
});
