import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import { loadConfig } from './config'

const root = createRoot(document.getElementById('root')!)

// load runtime config (from /config.json) then mount the app
loadConfig().finally(() => {
	try {
		root.render(
			<BrowserRouter>
				<App />
			</BrowserRouter>
		)
	} catch (err) {
		// If React render throws, ensure we display the error instead of a blank page
		try {
			document.documentElement.innerHTML = '';
			const pre = document.createElement('pre');
			pre.style.whiteSpace = 'pre-wrap';
			pre.style.fontFamily = 'monospace';
			pre.style.background = '#fff6f6';
			pre.style.color = '#900';
			pre.style.padding = '16px';
			pre.style.margin = '16px';
			pre.textContent = 'Render error:\n\n' + (err && (err.stack || err.message || String(err)));
			document.body.appendChild(pre);
		} catch (e) {
			console.error('Failed to show render error', e);
		}
		console.error('React render error', err);
	}
})
