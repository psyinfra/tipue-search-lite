# Tipue Search Lite

Tipue Search Lite is a vanilla JavaScript fork of the popular [Tipue Search](https://github.com/michael-milette/Tipue-Search)
project. It has a slimmed down feature set, and is gradually receiving
improvements to simplify the logic and take advantage of JavaScript features
that have become available over the last decade.

Tipue Search Lite is most commonly used as a search engine for static websites.

## Features

Differences from Tipue Search 7.1

* Removed dependency on jQuery
* Removed image support
* Removed hard-coded related searches
* Removed word replacement
* Removed stemming replacement
* Removed pagination of results
* Removed hard-coded page-weighting
* Significant code refactoring, modernization, and bug fixing


## Settings

To modify the output, change the corresponding value of the `set` variable in
`tipuesearch_lite.js`:

* **showContext**: show part of text from page with results
* **contextLength**: number of characters for context
* **showTime**: show search time on top of results
* **showURL**: show URL of pages


## Search Index

Several static site generators support building the index for Tipue Search,
including Pelican ([pelican-plugins/tipue-search](https://github.com/pelican-plugins/tipue-search))
and Jekyll ([jekyll-tipue-search](https://github.com/jekylltools/jekyll-tipue-search)).

[StaticIndexer](https://github.com/MaxBittker/StaticIndexer) can be used to
generate the index independent of a static site generator.


## Examples

A demo is available under the `demo/` folder. An example of Tipue Search Lite
integrated with a Pelican website is available at [https://github.com/psychoinformatics-de/studyforrest-www](psychoinformatics-de/studyforrest-www).


## Code History

This fork was originally a component of a larger, internal project. No effort
was made to import the upstream code history.

When the upstream Tipue project ended, it was decided to separate this code into
its own repository so that it could be shared publicly. For this reason, there
is no history further back than the initial import of the unminified 7.1
codebase.


## Copyright

Tipue Search was originally developed by Tipue and released under the MIT
license. Others contributed developments to upstream (including Michael Milette,
for version 6.0).

Tipue Search Lite was released in 2020.

See the LICENSE file and code history for more information.
