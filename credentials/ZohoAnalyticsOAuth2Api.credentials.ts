import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZohoAnalyticsOAuth2Api implements ICredentialType {
	name = 'zohoAnalyticsOAuth2Api';
	extends = ['oAuth2Api'];
	displayName = 'Zoho Analytics OAuth2 API';
	documentationUrl = 'https://www.zoho.com/analytics/api/#oauth';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Australia (com.au)',
					value: 'com.au',
				},
				{
					name: 'China (com.cn)',
					value: 'com.cn',
				},
				{
					name: 'Europe (eu)',
					value: 'eu',
				},
				{
					name: 'India (in)',
					value: 'in',
				},
				{
					name: 'Japan (jp)',
					value: 'jp',
				},
				{
					name: 'United States (com)',
					value: 'com',
				},
			],
			default: 'eu',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: '=https://accounts.zoho.{{$self["environment"]}}/oauth/v2/auth',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: '=https://accounts.zoho.{{$self["environment"]}}/oauth/v2/token',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'ZohoAnalytics.fullaccess.all',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'access_type=offline&prompt=consent',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
