/* eslint-env mocha */

import loginPage from '../../pageobjects/login.page';
import setupWizard from '../../pageobjects/setup-wizard.page';
import supertest from 'supertest';

import { adminUsername, adminPassword } from '../../data/user.js';

const request = supertest('http://localhost:3000');
const prefix = '/api/v1/';

function api(path) {
	return prefix + path;
}

const credentials = {
	['X-Auth-Token']: undefined,
	['X-User-Id']: undefined
};

const login = {
	user: adminUsername,
	password: adminPassword
};

describe('[Login]', () => {
	before(()=>{
		loginPage.open();
		// This Can Cause Timeouts erros if the server is slow so it should have a big wait
		loginPage.emailOrUsernameField.waitForVisible(15000);
	});

	describe('[Render]', () => {
		it('it should show email / username field', () => {
			loginPage.emailOrUsernameField.isVisible().should.be.true;
		});

		it('it should show password field', () => {
			loginPage.passwordField.isVisible().should.be.true;
		});

		it('it should show submit button', () => {
			loginPage.submitButton.isVisible().should.be.true;
		});

		it('it should show register button', () => {
			loginPage.registerButton.isVisible().should.be.true;
		});

		it('it should show forgot password button', () => {
			loginPage.forgotPasswordButton.isVisible().should.be.true;
		});

		it('it should not show name field', () => {
			loginPage.nameField.isVisible().should.be.false;
		});

		it('it should not show email field', () => {
			loginPage.emailField.isVisible().should.be.false;
		});

		it('it should not show confirm password field', () => {
			loginPage.confirmPasswordField.isVisible().should.be.false;
		});

		it('it should not show back to login button', () => {
			loginPage.backToLoginButton.isVisible().should.be.false;
		});
	});

	describe('[Required Fields]', () => {
		before(() => {
			loginPage.submit();
		});

		describe('email / username: ', () => {
			it('it should be required', () => {
				loginPage.emailOrUsernameField.getAttribute('class').should.contain('error');
				loginPage.emailOrUsernameInvalidText.getText().should.not.be.empty;
			});
		});

		describe('password: ', () => {
			it('it should be required', () => {
				loginPage.passwordField.getAttribute('class').should.contain('error');
				loginPage.passwordInvalidText.getText().should.not.be.empty;
			});
		});
	});
});

let alreadyExecuted = false;
function getSetupWizardStatus(done) {
	request.post(api('login'))
		.send(login)
		.expect('Content-Type', 'application/json')
		.expect(200)
		.expect((res) => {
			credentials['X-Auth-Token'] = res.body.data.authToken;
			credentials['X-User-Id'] = res.body.data.userId;
		})
		.end(() => {
			request.get(api('settings/Show_Setup_Wizard'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					alreadyExecuted = res.body.value === 'completed';
				})
				.end(done);
		});
	request.post(api('logout'))
		.send(credentials)
		.expect('Content-Type', 'application/json')
		.expect(200)
		.expect((res) => {
			console.log(res);
			return res.status = 'success';
		})
		.end(done);
}
describe('[Setup Wizard]', () => {
	before((done)=>{
		//check to see if the setup-wizard already executed.
		alreadyExecuted = getSetupWizardStatus(done);

		setupWizard.login();
		setupWizard.organizationType.waitForVisible(15000);
		//login as Admin
		//loginPage.login({ email: adminEmail, password: adminPassword });
	});

	it(`Setup Wizard configured already: ${ alreadyExecuted }`, () => {
		if (alreadyExecuted) {
			describe('Setup Wizard already completed earlier on', () => {
				it.skip('skip the setup wizard tests', () => {
					// kept atleast one empty condition to show the execution log on the console.
				});
			});
		} else {
			describe('[Render - Step 1]', () => {
				before(() => {
					browser.pause(5000); // to make sure the wizard screen is visible
				});
				it('it should show organization type', () => {
					setupWizard.organizationType.isVisible().should.be.true;
				});

				it('it should show organization name', () => {
					setupWizard.organizationName.isVisible().should.be.true;
				});

				it('it should show industry', () => {
					setupWizard.industry.isVisible().should.be.true;
				});

				it('it should show size', () => {
					setupWizard.size.isVisible().should.be.true;
				});

				it('it should show country', () => {
					setupWizard.country.isVisible().should.be.true;
				});

				it('it should show website', () => {
					setupWizard.website.isVisible().should.be.true;
				});

				after(() => {
					setupWizard.goNext();
				});
			});

			describe('[Render - Step 2]', () => {
				it('it should show site name', () => {
					setupWizard.siteName.isVisible().should.be.true;
				});

				it('it should show language', () => {
					setupWizard.language.isVisible().should.be.true;
				});

				it('it should server type', () => {
					setupWizard.serverType.isVisible().should.be.true;
				});

				after(() => {
					setupWizard.goNext();
				});
			});

			describe('[Render - Step 3]', () => {
				it('it should have option for registered server', () => {
					setupWizard.registeredServer.isExisting().should.be.true;
				});

				it('it should have option for standalone server', () => {
					setupWizard.standaloneServer.isExisting().should.be.true;
				});

				it('it should check option for registered server by default', () => {
					setupWizard.registeredServer.isSelected().should.be.true;
				});

				after(() => {
					setupWizard.goNext();
				});
			});

			describe('[Render - Final Step]', () => {
				it('it should render "Go to your workspace button', () => {
					setupWizard.goToWorkspace.waitForVisible(15000);
					setupWizard.goToWorkspace.isVisible().should.be.true;
				});

				after(() => {
					setupWizard.goToHome();
				});
			});
		}
	});

	after(() => {
		/* 		browser.execute(function() {
			const user = Meteor.user();
			Meteor.logout(() => {
				RocketChat.callbacks.run('afterLogoutCleanUp', user);
				Meteor.call('logoutCleanUp', user);
				FlowRouter.go('home');
			});
		}); */
	});
});
