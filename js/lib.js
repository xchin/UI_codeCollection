(function (win, doc, undefined) {
	'use strict';

	/**
	 * Build the global VX object
	 */
	if (!win.VX) {
		win.VX = {};
	}

	/**
	 * Build feature detection object
	 */
	win.VX.featDetection = {
		hasFocusIn: !!("onfocusin" in win),
		hasPlaceholder: typeof doc.createElement('input').placeholder === 'string',
		hasTransition: doc.body.style.transition === ''
	};
}(window, document));


;// End of file

(function (win, doc, undefined) {
	'use strict';

	/**
	 * Grab the main parent element for event delegation, rather than
	 * attaching an event listener to each individual floating label instance.
	 */
	var root = doc.getElementById('control') || document.body;


	/** *******************************
	 * GENERIC REUSABLE DOM FUNCTIONS
	 */

	/**
	 * @function identifyParentElement - crawls up the DOM to find a needed parent
	 * @param {Object} params - required; configuration object
	 * @param {Object} params.child - required; the root child, DOM element
	 * @param {string} params.className - required; the needed parent's class name
	 * @param {number} params.maxLevels - optional; the maximum number of parent lookups
	 * @param {function} params.callback - required; callback because the DOM is async
	 * @param {number} currentLevel - internal only; counts the level-ups
	 */
	function identifyParentElement(params, currentLevel) {
		var el = params.child.parentElement,
			className = params.className,
			callback = params.callback,
			maxLevels = params.maxLevels || 2;

		/**
		 * Original call should be undefined, so provide a default of 1
		 * If recursively called, ++ the value
		 */
		currentLevel = currentLevel || 1;

		if (!el) {
			// Bail early
			callback(false);
			
		} else if (el.className.indexOf(className) === -1 &&
			currentLevel <= maxLevels) {

			identifyParentElement({
					child: el,
					className: className,
					callback: callback,
					maxLevels: maxLevels
				},
				currentLevel++);

		} else if (el.className.indexOf(className) === -1 &&
			currentLevel > maxLevels) {

			callback(false); // call with false as parent wasn't found

		} else {
			callback(true, el);
		}
	}


	/** *******************************
	 * INPUT FUNCTIONALITY
	 */

	function focusInCb(event) {
		var target = event.target;
		/**
		 * Test if the target was an input, and not a textarea or another element
		 */
		if (target && target.tagName.toUpperCase() === 'INPUT') {
			/**
			 * Find out if parent or grandparent has the vx_floatingLabel class
			 */
			identifyParentElement({
				child: target,
				className: 'floatingLabel',
				maxLevels: 2,
				callback: function (hasClass, el) {
					if (hasClass) {
						/**
						 * Add the focus class remove value class if present
						 */
						el.classList.remove('hasValue');
						el.classList.add('hasFocus');
					}
				}
			});
		}
	}
	function focusOutCb(event) {
		var target = event.target;

		if (target && target.tagName.toUpperCase() === 'INPUT') {
			/**
			 * Find out if parent or grandparent has the vx_floatingLabel class
			 */
			identifyParentElement({
				child: target,
				className: 'floatingLabel',
				maxLevels: 2,
				callback: function (hasClass, el) {
					if (hasClass) {
						/**
						 * Does target have a value?
						 * If so, add value class remove focus class
						 */
						if (target.value) {
							el.classList.add('hasValue');
							el.classList.remove('hasFocus');
						} else {
							/**
							 * If no, remove the value and focus class
							 */
							el.classList.remove('hasValue');
							el.classList.remove('hasFocus');
						}
					}
				}
			});
		}
	}

	if (VX.featDetection.hasFocusIn) {
		root.addEventListener('focusin', focusInCb);
		root.addEventListener('focusout', focusOutCb);
	} else {
		root.addEventListener('focus', focusInCb, true);
		root.addEventListener('blur', focusOutCb, true);
	}

	/**
	 *	Floating labels could have a default value and this functions updates the state of
	 *	labels which has value.
	 * @param scope {object} - optional: DOM element to restrict query
	 */
	function evaluateFloatingLabels(scope) {
		var context = scope || doc,
			inputElements = context.querySelectorAll('.floatingLabel input'),
			i = 0,
			len = inputElements.length;

		for (i; i < len; i++) {
			/**
			 * Append 'hasValue' CSS class
			 */
			updateFloatingLabelState(inputElements[i]);
		}
	}

	/**
	 *	This function avoids the JS lint warning of adding "identifyParentElement" in a loop.
	 *
	 *	@param inputEl {object} - required; Expects this to be an input element DOM type
	 */
	function updateFloatingLabelState(inputEl) {
		identifyParentElement({
			child: inputEl,
			className: 'floatingLabel',
			maxLevels: 2,
			callback: function (hasClass, el) {
				if (hasClass) {
					/**
					 * Does target have a value?
					 * If so, add hasValue class
					 */
					if (inputEl && inputEl.value && inputEl.value !== '') {
						el.classList.add('hasValue');
					} else {
						/**
						 * If no, remove the hasValue class
						 */
						el.classList.remove('hasValue');
					}

					/**
					 *	Makes every Floating element an active one
					 */

					el.classList.add('floatingLabel_active');
					el.classList.remove('floatingLabel');
				}
			}
		});
	}

	if (!win.VX) {
		console.error('Error: the component `core.js` is required.');
	} else if (!win.VX.inputsSelects) {
		win.VX.inputsSelects = {};
	}
	/**
	 * Expose evaluateFloatingLabels for programmatic control
	 */
	win.VX.inputsSelects.evaluateFloatingLabels = evaluateFloatingLabels;
	/**
	 * Execute on bootstrap of JS for initial load
	 */
	evaluateFloatingLabels();
}(window, document));


;// End of file

/**
 * JS component for handling the behavior of the modal feature
 */
(function (win, doc, undefined) {
	'use strict';

	/**
	 * Grab the main parent element for event delegation, rather than
	 * attaching an event listener to each individual floating label instance.
	 */
	var root = doc.getElementById('control') || document.body;

	function openVxModal(modalId) {
		/**
		 * Grab scroll position for preserving during modal operations.
		 * The multiple attempts are because of nasty browser inconsistencies :(
		 * Then, grab reference to the desired modal element.
		 */
		var scrollPos = (
				document.documentElement.scrollTop ||
				document.body.parentNode.scrollTop ||
				document.body.scrollTop
			),
			modalEl = doc.getElementById(modalId),
			modalBg = doc.getElementById('modal-background');
		/**
		 * @function finishTransition - responsible for cleaning up after transitions
		 */
		function finishTransition() {
			/**
			 * Preserve the original scroll position by positioning the element with `top` prop
			 */
			doc.querySelector('.foreground-container').setAttribute('style', 'top: -' + scrollPos + 'px;');
			/**
			 * Save the scroll position to the body for later retrieval
			 */
			root.setAttribute('data-scroll-position', scrollPos);
			/**
			 * Set the scroll position to 0 to ensure the top of the modal is visible,
			 * if the view was scrolled down to click on the trigger
			 */
			doc.body.scrollTop = 0;
			/**
			 * Add and remove the appropriate classes
			 */
			root.classList.add('hasOpenModal');
			modalEl.classList.remove('modalIsOpening');
			modalEl.classList.add('modalIsOpen');
			/**
			 * Remove event listener.
			 */
			modalEl.removeEventListener('transitionend', finishTransition);
		}

		/**
		 * Add the background to the body, if needed
		 */
		if (!modalBg) {
			modalBg = doc.createElement('div');
			modalBg.setAttribute('class', 'modal-background modalPrepBg');
			modalBg.setAttribute('id', 'modal-background');
			root.appendChild(modalBg);
		} else {
			modalBg.classList.add('modalPrepBg');
		}
		/**
		 * Prep the modal for animation. I.e. add change from `display: none`
		 */
		modalEl.classList.add('modalPrepToOpen');
		/**
		 * What for DOM to update and register new `display` prop for both modal and BG
		 */
		setTimeout(function () {
			modalEl.classList.add('modalIsOpening');
			modalBg.classList.add('modalBgIsShown');
		}, 35);
		/**
		 * Does client have transitionEnd event?
		 * If not, fallback to setTimeout
		 */
		if (VX.featDetection.hasTransition) {
			modalEl.addEventListener('transitionend', finishTransition);
		} else {
			setTimeout(finishTransition, 220);
		}
	}
	function closeVxModal(modalId) {
		/**
		 * Grab original scroll position before opening the modal.
		 * Grab modal reference or just grab the current open modal element.
		 */
		var scrollPos = root.getAttribute('data-scroll-position'),
			modalEl = modalId ? doc.getElementById(modalId) : doc.querySelector('.modalIsOpen'),
			modalBg = doc.getElementById('modal-background');
		/**
		 * @function finishTransition - responsible for cleaning up after transitions
		 */
		function finishTransition() {
			/**
			 * Remove the "faked" scroll position
			 */
			doc.querySelector('.foreground-container').removeAttribute('style');
			/**
			 * Grab the original scroll position and add it back to the body
			 */
			root.removeAttribute('data-scroll-position');
			doc.body.scrollTop = scrollPos;
			/**
			 * Add and remove the appropriate classes
			 */
			modalEl.classList.remove('modalIsClosing');
			modalEl.classList.remove('modalPrepToOpen');
			modalBg.classList.remove('modalPrepBg');
			/**
			 * Remove event listener.
			 */
			modalEl.removeEventListener('transitionend', finishTransition);
		}
		/**
		 * Prep body and modal for close animation
		 */
		root.classList.remove('hasOpenModal');
		modalEl.classList.remove('modalIsOpen');
		modalBg.classList.remove('modalBgIsShown');
		modalEl.classList.add('modalIsClosing');
		/**
		 * Does client have transitionEnd event?
		 */
		if (VX.featDetection.hasTransition) {
			modalEl.addEventListener('transitionend', finishTransition);
		} else {
			setTimeout(finishTransition, 220);
		}
	}
	/**
	 * @function - adds `click` event listener to container element
	 *
	 * Note: Uses "event delegation" to conserve memory and handle dynamic elements
	 */
	root.addEventListener('click', function (event) {
		var modalId;
		/**
		 * Are we clicking on a trigger to open or close modal?
		 */
		if (event.target.className.indexOf('modal-trigger') !== -1) {
			modalId = event.target.getAttribute('data-modal-id');
			openVxModal(modalId);
		}
		if (event.target.className.indexOf('modal-dismiss_trigger') !== -1 ||
			event.target.className.indexOf('modal-dismiss_x-trigger') !== -1) {
			modalId = event.target.getAttribute('data-modal-id');
			closeVxModal(modalId);
		}
	});
	/**
	 * @function - adds `keyup` event listener to container element
	 *
	 * Note: listens for ESC key only
	 */
	root.addEventListener('keyup', function (event) {
		if (event.keyCode === 27 && doc.body.className.indexOf('hasOpenModal')) {
			closeVxModal();
		}
	});

	if (!win.VX) {
		console.error('Error: the component `core.js` is required.');
	} else if (!win.VX.modal) {
		win.VX.modal = {};
	}
	/**
	 * Expose open and close for programmatic control
	 */
	win.VX.modal.open = openVxModal;
	win.VX.modal.close = closeVxModal;
}(window, document));


;// End of file

/**
 * @IIFE transition to a flow animation
 * This provides the fade out and fade in for transition between flows
 */
(function (win, doc, undefined) {
	'use strict';

	var root = doc.getElementById('control') || document.body;

	function startFlow() {
		var el = document.querySelector('.addFlowTransition');
		el.classList.add('hasFadeTransition');
	}
	function endFlow() {
		var el = document.querySelector('.addFlowTransition');
		el.classList.remove('hasFadeTransition');
	}
	function bindFlowListener() {
		root.addEventListener('click', function (event) {
			var target = event.target;
			if (target.className.indexOf('flowTrigger') !== -1) {
				startFlow();
			}
		});
	}

	if (root.className.indexOf('hasFadeTransition') !== -1) {
		bindFlowListener();
		setTimeout(function () {
			endFlow();
		}, 35);
	} else if (document.querySelector('.addFlowTransition')) {
		bindFlowListener();
	}

	if (!win.VX) {
		console.error('Error: the component `core.js` is required.');
	} else if (!win.VX.transitions) {
		win.VX.transitions = {};
	}

	win.VX.transitions.startFlow = startFlow;
}(window, document));

/**
 * @IIFE stepped animation functionality
 * This provides the animation for stepping through a flow
 */
(function (win, doc, undefined) {
	'use strict';

	function measureElHeight(el, callback) {
		var elHeight;

		// Quickly rendering to DOM to measure height and width.
		// Then, removing it.
		el.classList.add('invisiblyRender');
		elHeight = el.offsetHeight;
		el.classList.remove('invisiblyRender');

		callback(elHeight);
	}
	function slideToStep(container, currentStep, requestedStep) {
		var animatingEl = container.firstElementChild,
			slides = animatingEl.querySelectorAll('.steppedFlow-slide'),
			direction = currentStep < requestedStep ? 'right' : 'left',
			cachedSlideHeight;

		// Decrement the count so first step starts at 1 and not 0
		currentStep--;
		requestedStep--;

		function prepForSlide(startHeight) {
			// container.style.height = startHeight + 'px';
			container.classList.add('prepForAnimation');
			animatingEl.classList.add('slide-' + direction + '_start');
			animatingEl.focus();

			// add 'active' class to requested module, so both it and current module are active/visible before animating
			slides[requestedStep].classList.add('activeSlide');

			animatingEl.classList.add('prepToSlide');

			setTimeout(function () {

				animatingEl.classList.add('slide-' + direction + '_end');

				// This code needs to be delayed to work properly
				setTimeout(function () {
					measureElHeight(slides[requestedStep], function (endHeight) {
						cachedSlideHeight = endHeight;
						// Wait to animate the height until the module completes sliding into position
						//container.style.height = endHeight + 'px';

						if (VX.featDetection.hasTransition) {
							animatingEl.addEventListener('transitionend', completeSlide, false);
						} else {
							setTimeout(completeSlide, 300);
						}
					});
				}, 50);
			}, 35);
		}
		function completeSlide() {
			var cntnrClassList = animatingEl.classList;

			cntnrClassList.remove(
				'prepToSlide',
				'slide-right_start',
				'slide-right_end',
				'slide-left_start',
				'slide-left_end'
			);

			container.removeAttribute('style');
			container.classList.remove('prepForAnimation');

			slides[currentStep].classList.remove('activeSlide');
			animatingEl.removeEventListener('transitionend', completeSlide, false);
		}
		if (cachedSlideHeight) {
			prepForSlide(cachedSlideHeight);
		} else {
			measureElHeight(slides[currentStep], prepForSlide);
		}
	}

	if (!win.VX) {
		console.error('Error: the component `core.js` is required.');
	} else if (!win.VX.transitions) {
		win.VX.transitions = {};
	}

	VX.transitions.slideToStep = slideToStep;
}(window, document));