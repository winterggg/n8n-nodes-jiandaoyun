import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class JiandaoyunApi implements ICredentialType {
	name = 'jiandaoyunApi';

	displayName = 'Jiandaoyun API';

	documentationUrl = 'https://hc.jiandaoyun.com/open/10992#22%E5%88%9B%E5%BB%BAapikey';

	icon: Icon = {
		light: 'file:jiandaoyun.light.png',
		dark: 'file:jiandaoyun.dark.png',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'OpenAPI Server',
			name: 'server',
			type: 'string',
			default: 'https://api.jiandaoyun.com/',
			description: 'Switch to https://dev.jiandaoyun.com/ only for development purposes.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.server}}',
			url: '/api/v5/app/list',
			method: 'POST',
			body: {
				limit: 1,
			},
		},
	};
}
