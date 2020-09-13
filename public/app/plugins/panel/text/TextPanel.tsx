// Libraries
import React, { PureComponent } from 'react';
import { debounce } from 'lodash';
import { LegacyGraphHoverEvent, PanelProps, renderMarkdown, textUtil } from '@grafana/data';
// Utils
import config from 'app/core/config';
// Types
import { TextOptions } from './types';
import { CustomScrollbar, stylesFactory } from '@grafana/ui';
import { css, cx } from 'emotion';
import DangerouslySetHtmlContent from 'dangerously-set-html-content';
import { Unsubscribable } from 'rxjs';

interface Props extends PanelProps<TextOptions> {}

interface State {
  html: string;
}

export class TextPanel extends PureComponent<Props, State> {
  eventSub?: Unsubscribable;

  constructor(props: Props) {
    super(props);

    this.state = {
      html: this.processContent(props.options),
    };
  }

  updateHTML = debounce(() => {
    const html = this.processContent(this.props.options);
    if (html !== this.state.html) {
      this.setState({ html });
    }
  }, 150);

  componentDidMount() {
    this.eventSub = this.props.eventBus.$on(LegacyGraphHoverEvent, event => {
      console.log('grap hover event', event);
    });
  }

  componentWillUnmount() {
    this.eventSub?.unsubscribe();
  }

  componentDidUpdate(prevProps: Props) {
    // Since any change could be referenced in a template variable,
    // This needs to process everytime (with debounce)
    this.updateHTML();
  }

  prepareHTML(html: string): string {
    return this.interpolateAndSanitizeString(html);
  }

  prepareMarkdown(content: string): string {
    return renderMarkdown(this.interpolateAndSanitizeString(content));
  }

  interpolateAndSanitizeString(content: string): string {
    const { replaceVariables } = this.props;

    content = replaceVariables(content, {}, 'html');

    return config.disableSanitizeHtml ? content : textUtil.sanitize(content);
  }

  processContent(options: TextOptions): string {
    const { mode, content } = options;

    if (!content) {
      return '';
    }

    if (mode === 'markdown') {
      return this.prepareMarkdown(content);
    }

    return this.prepareHTML(content);
  }

  render() {
    const { html } = this.state;
    const styles = getStyles();
    return (
      <CustomScrollbar autoHeightMin="100%">
        <DangerouslySetHtmlContent html={html} className={cx('markdown-html', styles.content)} />
      </CustomScrollbar>
    );
  }
}

const getStyles = stylesFactory(() => {
  return {
    content: css`
      height: 100%;
    `,
  };
});
