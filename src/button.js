import * as services from './services';
import { deepmerge, dataset, makeUrl, className, addParamsToUrl, openPopup, toArray, svg } from './util';

/**
 * A button.
 *
 * @param {HTMLElement} widget
 * @param {Object} options
 */
export default class Button {
	constructor(widget, options) {
		this.widget = widget;
		this.data = dataset(widget);
		this.options = deepmerge(options, this.data);

		this.initService();
		if (this.service) {
			this.initHtml();
			this.initEvents();
		}
		else if (process.env.NODE_ENV === 'development') {
			console.error(`Social Likes: service for widget "${widget.className}" not found.`);
		}
	}

	/**
	 * Update options.
	 *
	 * @param {Object} options New options.
	 */
	update(options) {
		this.options = deepmerge(this.options, options);
	}

	/**
	 * Read service name and apply it’s options.
	 * Service can be a class on the widget (.facebook) or `service` option.
	 */
	initService() {
		let service = this.options.service;
		if (!service) {
			// class="facebook"
			service = toArray(this.widget.classList).reduce((_, cls) => {
				if (services[cls]) {
					return cls;
				}
			}, null);
			if (!service) {
				return;
			}
		}
		this.service = service;
		this.options = deepmerge(this.options, services[service]);
	}

	/**
	 * Initialize markup of a button.
	 */
	initHtml() {
		let cx = name => className(name, this.service);
		let widget = this.widget;
		let options = this.options;

		// Remove existing class (.facebook) with a proper one
		widget.classList.remove(this.service);
		cx('widget').split(' ').forEach(cls => widget.classList.add(cls));

		// Button:
		// 1. Normal button with <button> tag.
		// 2. Link <a> if the service has the clickUrl option.
		// 3. Link <a> with .social-likes__invisible-button class if clickUrl option is true but widget markup has no text.
		// 4. No button if there’s no text in the markup and no clickUrl option.
		let buttonHtml = '';
		let clickUrl = options.clickUrl;
		let oldHtml = widget.innerHTML.trim();
		if (clickUrl || oldHtml) {
			let buttonTag = 'div';
			let buttonHref = '';
			let buttonClasses = cx('button');
			if (options.clickUrl) {
				let url = this.makeUrl(options.clickUrl);
				buttonTag = 'a';
				buttonHref = `href="${url}"`;
				if (!oldHtml) {
					buttonClasses = cx('invisible-button');
				}
			}
			buttonHtml = `
				<${buttonTag} ${buttonHref} class="${buttonClasses}">
					${oldHtml}
				</${buttonTag}>
			`;
		}
		else {
			widget.classList.add(className('widget_notext'));
		}

		// Icon
		let svgHtml = svg(this.options.icon, cx('icon'));

		widget.innerHTML = svgHtml + buttonHtml;
	}

	/**
	 * Attach event handlers.
	 */
	initEvents() {
		if (!this.options.clickUrl) {
			this.widget.addEventListener('click', this.onClick.bind(this));
		}
	}

	/**
	 * Replace URL and title in an URL template.
	 *
	 * @param {String} urlTemplate URL template.
	 * @return {String}
	 */
	makeUrl(urlTemplate) {
		return makeUrl(urlTemplate, {
			url: this.options.url,
			title: this.options.title
		});
	}

	/**
	 * Button click handler.
	 *
	 * @param {Event} event Event.
	 */
	onClick(event) {
		let options = this.options;
		let ok = true;
		if (typeof options.click === 'function') {
			ok = options.click.call(this, event);
		}
		if (ok) {
			let url = this.makeUrl(options.popupUrl);
			let params = deepmerge(this.data, this.options.data);
			url = addParamsToUrl(url, params);
			openPopup(url, {
				width: options.popupWidth,
				height: options.popupHeight,
				name: `sl_${this.service}`
			});
		}
	}
}