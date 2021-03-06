import jQuery from 'jquery';
import PropTypes from 'prop-types';
import React from 'react';
import createReactClass from 'create-react-class';
import {Link, browserHistory} from 'react-router';
import ApiMixin from '../../mixins/apiMixin';
import DateTime from '../../components/dateTime';
import Avatar from '../../components/avatar';
import LoadingError from '../../components/loadingError';
import LoadingIndicator from '../../components/loadingIndicator';
import Pagination from '../../components/pagination';
import SearchBar from '../../components/searchBar';
import {t} from '../../locale';
import withEnvironmentInQueryString from '../../utils/withEnvironmentInQueryString';

const ProjectEvents = createReactClass({
  displayName: 'ProjectEvents',

  propTypes: {
    defaultQuery: PropTypes.string,
    setProjectNavSection: PropTypes.func,
  },

  mixins: [ApiMixin],

  getDefaultProps() {
    return {
      defaultQuery: '',
    };
  },

  getInitialState() {
    let queryParams = this.props.location.query;

    return {
      eventList: [],
      loading: true,
      error: false,
      query: queryParams.query || this.props.defaultQuery,
      pageLinks: '',
    };
  },

  componentWillMount() {
    this.props.setProjectNavSection('events');
    this.fetchData();
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.search !== this.props.location.search) {
      let queryParams = nextProps.location.query;
      this.setState(
        {
          query: queryParams.query,
        },
        this.fetchData
      );
    }
  },

  onSearch(query) {
    let targetQueryParams = {};
    if (query !== '') targetQueryParams.query = query;

    let {orgId, projectId} = this.props.params;
    browserHistory.push({
      pathname: `/${orgId}/${projectId}/events/`,
      query: targetQueryParams,
    });
  },

  fetchData() {
    this.setState({
      loading: true,
      error: false,
    });

    this.api.request(this.getEndpoint(), {
      success: (data, _, jqXHR) => {
        this.setState({
          error: false,
          loading: false,
          eventList: data,
          pageLinks: jqXHR.getResponseHeader('Link'),
        });
      },
      error: () => {
        this.setState({
          error: true,
          loading: false,
        });
      },
    });
  },

  getEventTitle(event) {
    return event.message.split('\n')[0].substr(0, 100);
  },

  getEndpoint() {
    let params = this.props.params;
    let queryParams = {
      ...this.props.location.query,
      limit: 50,
      query: this.state.query,
    };

    return `/projects/${params.orgId}/${params.projectId}/events/?${jQuery.param(
      queryParams
    )}`;
  },

  renderStreamBody() {
    let body;

    if (this.state.loading) body = this.renderLoading();
    else if (this.state.error) body = <LoadingError onRetry={this.fetchData} />;
    else if (this.state.eventList.length > 0) body = this.renderResults();
    else if (this.state.query && this.state.query !== this.props.defaultQuery)
      body = this.renderNoQueryResults();
    else body = this.renderEmpty();

    return body;
  },

  renderLoading() {
    return (
      <div className="box">
        <LoadingIndicator />
      </div>
    );
  },

  renderNoQueryResults() {
    return (
      <div className="box empty-stream">
        <span className="icon icon-exclamation" />
        <p>{t('Sorry, no events match your filters.')}</p>
      </div>
    );
  },

  renderEmpty() {
    return (
      <div className="box empty-stream">
        <span className="icon icon-exclamation" />
        <p>{t("There don't seem to be any events.")}</p>
      </div>
    );
  },

  renderResults() {
    let {orgId, projectId} = this.props.params;

    let children = this.state.eventList.map((event, eventIdx) => {
      return (
        <tr key={event.id}>
          <td style={{width: 240}}>
            <small>
              <DateTime date={event.dateCreated} />
            </small>
          </td>
          <td>
            <h5>
              <Link
                to={`/${orgId}/${projectId}/issues/${event.groupID}/events/${event.id}/`}
              >
                {this.getEventTitle(event)}
              </Link>
            </h5>
          </td>
          <td className="event-user table-user-info" style={{textAlign: 'right'}}>
            {event.user ? (
              <div>
                <Avatar user={event.user} size={64} className="avatar" />
                {event.user.email}
              </div>
            ) : (
              <span>—</span>
            )}
          </td>
        </tr>
      );
    });

    return (
      <div className="event-list">
        <table className="table">
          <tbody>{children}</tbody>
        </table>
      </div>
    );
  },

  render() {
    return (
      <div>
        <div className="row release-list-header">
          <div className="col-sm-7">
            <h3>{t('Events')}</h3>
          </div>
          <div className="col-sm-5 release-search">
            <SearchBar
              defaultQuery=""
              placeholder={t('Search event message')}
              query={this.state.query}
              onSearch={this.onSearch}
            />
          </div>
        </div>
        <div className="alert alert-block alert-info">
          {t(`Psst! This feature is still a work-in-progress. Thanks for being an early
          adopter!`)}
        </div>
        {this.renderStreamBody()}
        <Pagination pageLinks={this.state.pageLinks} />
      </div>
    );
  },
});

export default withEnvironmentInQueryString(ProjectEvents);
