% -------------------------------------------------------------------
%  @LaTeX-class-file{
%     filename        = "hust-thesis.cls",
%     version         = "0.0.1",
%     date            = "2021",
%     codetable       = "ISO/ASCII",
%     keywords        = "LaTeX, hust-thesis",
%     supported       = "send email to ngocjr7@gmail.com",
%     docstring       = "A thesis class for a HUST dissertation. This is an adaptation based on Harvard's template."
% --------------------------------------------------------------------

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{uet-awesome-thesis}[2021/12/28 University of Engineering and Technology Thesis Class]

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{book}}
\ProcessOptions\relax
\LoadClass[oneside]{book}
\usepackage{scrextend}
\changefontsizes{13pt}

% Required packages
\RequirePackage{graphicx}
\RequirePackage{hyperref}
\RequirePackage[toc]{glossaries}
\RequirePackage{glossary-mcols}
\RequirePackage{here}
\RequirePackage[toc]{appendix}

\RequirePackage{amssymb}
\RequirePackage{amsmath}
\RequirePackage{mathtools}
\RequirePackage{mathspec} %loads fontspec as well
\setmainfont{Times New Roman}
\setmathsfont(Digits,Latin){Times New Roman}
\setmathsfont[range=\mathup/{num,latin,Latin,greek,Greek}]{Times New Roman}
\setmathsfont[range=\mathbfup/{num,latin,Latin,greek,Greek}]{Times New Roman Bold}
\setmathsfont[range=\mathit/{num,latin,Latin,greek,Greek}]{Times New Roman Italic}
\setmathsfont[range=\mathbfit/{num,latin,Latin,greek,Greek}]{Times New Roman Bold Italic}
\setmathsfont{XITS Math}

\RequirePackage[numbers, comma, sort&compress]{natbib}
\RequirePackage[small, md, sc]{titlesec}
\RequirePackage[tight,nice]{units}
\RequirePackage{verbatim}
\RequirePackage[palatino]{quotchap}
\RequirePackage{ragged2e}
% colors
\RequirePackage{color}
\definecolor{Crimson}{rgb}{0.6471, 0.1098, 0.1882}

\hypersetup{
    colorlinks,
    citecolor=black,
    filecolor=black,
    linkcolor=black,
    urlcolor=black,
}

\RequirePackage{url}
\RequirePackage[titles]{tocloft}

\setcounter{tocdepth}{3}
\setcounter{secnumdepth}{3}

\renewcommand{\cftchapfont}{\normalsize \bfseries}
\setlength{\parindent}{1cm}
\setlength{\parskip}{6pt}

\RequirePackage{pdfsync} %do pdf synchronization [andy]
\RequirePackage[
    type={CC},
    modifier={by-nc-sa},
    version={3.0},
]{doclicense}

% \usepackage[closeFloats, noSeparatorLine]{fltpage} %use the custom modified fltpage package
% \RequirePackage{afterpage} 

\synctex=1 % turn synctex on automatically to sync between pdf viewer [andy]

%   list an entire bibliography entry inline. Useful for acknowledging when my paper was previously published
\RequirePackage{bibentry} 
\nobibliography*        

% \RequirePackage{lettrine} % big letter at start of chapter
\RequirePackage[a4paper]{geometry}
\geometry{left=3cm, right=2cm, top=2.5cm, bottom=3cm}

\RequirePackage{fancyhdr} 
\pagestyle{plain} % options: empty , plain , fancy

% \RequirePackage[quotchap]{quotchap} % chaper number 
% \definecolor{chaptergrey}{rgb}{0.6,0,0}

\RequirePackage{afterpage} 


\RequirePackage{titling}
\RequirePackage{setspace} 
\RequirePackage{booktabs} % for much better looking tables
\RequirePackage[labelfont={bf}, 
                justification=centering, % Theses captions are usually centered
                margin=0pt, 
                figurewithin=chapter,    % Figures are numbered by chapter (Figure 1.1)
                tablewithin=chapter      % Tables are numbered by chapter (Table 1.1)
                ]{caption}

% line alignment
\linespread{1.3}
\addtolength{\footnotesep}{\footnotesep}
\raggedright


\titleformat{\chapter}[display]
  {\Huge\bfseries}
  {\chaptertitlename\ \thechapter}{20pt}{\Huge\bfseries\sloppy}

\titleformat{\section}
  {\Large}
  {\thesection}{1em}{\Large}
  
\titleformat{\subsection}
  {\large}
  {\thesubsection}{1em}{\large}

\titleformat{\subsubsection}[runin]
  {\bf}
  {\thesubsection}{1em}{}

\titleformat{\paragraph}[runin]
  {\it}
  {}{1em}{}

% some definitions
\def\degreeyear#1{\gdef\@degreeyear{#1}}
\def\degreemonth#1{\gdef\@degreemonth{#1}}
\def\advisor#1{\gdef\@advisor{#1}}
\def\university#1{\gdef\@university{#1}}
\def\universitycity#1{\gdef\@universitycity{#1}}
\def\major#1{\gdef\@major{#1}}



\RequirePackage[english]{babel}

\RequirePackage{tikz}
\usetikzlibrary{calc}
\usetikzlibrary{decorations.pathmorphing}

\renewcommand{\maketitle}{ 
    % STEP 1: Force symmetrical margins (left=right=2.5cm) to center the content within the frame
    \newgeometry{left=2.5cm, right=2.5cm, top=2.5cm, bottom=3cm}
    \singlespacing
    \thispagestyle{empty}

    % Draw the TikZ frame (this is unchanged as it's drawn relative to the page center)
    \begin{tikzpicture}[overlay,remember picture]
    \draw [line width=1.5mm]
        ($ (current page.north west) + (2.2cm,-2.2cm) $)
        rectangle
        ($ (current page.south east) + (-2.2cm,2.2cm) $);
    \draw [line width=0.5mm]
        ($ (current page.north west) + (2.4cm,-2.4cm) $)
        rectangle
        ($ (current page.south east) + (-2.4cm,2.4cm) $);
    \end{tikzpicture}
    
    \begin{center}
    % STEP 2: Move the content closer to the top margin (reduce space from the frame)
    \vspace*{-0.8cm} 
    {\fontsize{12pt}{1}\selectfont \textbf{VIETNAM NATIONAL UNIVERSITY, HANOI}} \\[0.3cm]
    {\fontsize{12pt}{1}\selectfont \textbf{UNIVERSITY OF ENGINEERING AND TECHNOLOGY}} \\[1.5cm]
    
    {\includegraphics[scale=0.07]{UET_logo.png} \\ [1.5cm]}
    
    {\fontsize{14pt}{1}\selectfont \textbf{\@author}}\\[2.5cm]
    
    \parbox{0.9\textwidth}{\centering \linespread{1.3}\selectfont \fontsize{18pt}{22}\selectfont \textbf{\MakeUppercase{\@title}}}\\[2.5cm]
    
    % Adjust font size according to Appendix 01 regulations (14pt for degree type)
    {\fontsize{14pt}{1}\selectfont \textbf{BACHELOR THESIS}}\\[0.5cm]
    {\fontsize{14pt}{1}\selectfont \textbf{Major: \@major}}\\[4cm]
    
    \vspace*{\fill}
    {\fontsize{12pt}{1}\selectfont \textbf{HA NOI - \@degreeyear}}\\
    \end{center} 
    \newpage
    % STEP 3: Restore the 3cm-2cm margins for the inner content pages
    \restoregeometry
}

\newcommand{\makesidecover}{ 
    \newgeometry{left=2.5cm, right=2.5cm, top=2.5cm, bottom=3cm}
    \singlespacing
    \thispagestyle{empty}
    \begin{tikzpicture}[overlay,remember picture]
    \draw [line width=1.5mm]
        ($ (current page.north west) + (2.2cm,-2.2cm) $)
        rectangle
        ($ (current page.south east) + (-2.2cm,2.2cm) $);
    \draw [line width=0.5mm]
        ($ (current page.north west) + (2.4cm,-2.4cm) $)
        rectangle
        ($ (current page.south east) + (-2.4cm,2.4cm) $);
    \end{tikzpicture}
    
    \begin{center}
    \vspace*{-0.8cm}
    {\fontsize{12pt}{1}\selectfont \textbf{VIETNAM NATIONAL UNIVERSITY, HANOI}} \\[0.3cm]
    {\fontsize{12pt}{1}\selectfont \textbf{UNIVERSITY OF ENGINEERING AND TECHNOLOGY}} \\[2cm]
    
    {\fontsize{14pt}{1}\selectfont \textbf{\@author}}\\[2.5cm]
    \parbox{0.9\textwidth}{\centering \linespread{1.3}\selectfont \fontsize{18pt}{22}\selectfont \textbf{\MakeUppercase{\@title}}}\\[2.5cm]
    
    {\fontsize{14pt}{1}\selectfont \textbf{Major: \@major}}\\[3cm]
    \end{center} 
    
    % Supervisor information section according to Appendix 05
    {\fontsize{14pt}{1}\selectfont \textbf{Supervisor: \@advisor}}\\[2cm]
    
    \vspace*{\fill}
    \begin{center}
    {\fontsize{12pt}{1}\selectfont \textbf{HA NOI - \@degreeyear}}\\
    \end{center}
    \newpage
    \restoregeometry
}

\def\authorclass#1{\gdef\@authorclass{#1}}
\def\duration#1{\gdef\@duration{#1}}
\def\statement#1{\gdef\@statement{#1}}
\def\declaration#1{\gdef\@declaration{#1}}

% You might also consider licensing your work under Creative Commons). See: http://creativecommons.org/weblog/entry/12824 for other PhD students who have released their work under creative commons.

\newcommand{\abstractpage}[1]{
	\newpage
% 	\pagenumbering{roman}
% 	\setcounter{page}{3}
	\pagestyle{fancy}
	\lhead{Thesis advisor: \@advisor} \rhead{\@author}
	\renewcommand{\headrulewidth}{0.0pt} 
	\begin{center}
	\vspace*{1pt}
	\Large \textcolor{Crimson}{\textit{\@title}} \normalsize\\
	\vspace*{15pt}
	\bf Abstract \\ \rm
	\end{center}
	\doublespace %Harvard registrar requests that abstract is double spaced
	#1
	\doublespace %Harvard registrar requests that abstract is double spaced	
	\newpage \lhead{} \rhead{}
	\cfoot{\thepage}
	\onehalfspacing
}

% the list of authors
\newcommand{\authorlist}[1]{
	\pagestyle{fancy}
	\newpage
	\thispagestyle{fancy} 
	\chapter*{Author List}
	\noindent #1
	\newpage \rm
	}
	

% the acknowledgments page
\newcommand{\acknowledgments}[1]{
	\chapter*{Acknowledgments}
	\thispagestyle{empty}
	\noindent
	#1
	\vspace*{\fill}
	\newpage
}

% Keywords formatting command
\newcommand{\keywords}[1]{
	\vspace{1cm}
	\noindent\textbf{\textit{Keywords:}} \textit{#1}
}

% Frontmatter section command for consistent alignment and formatting
\newcommand{\frontmattersection}[2]{
	\chapter*{#1}
	\thispagestyle{empty}
	\noindent
	#2
}
	
% An environment for paragraph-style section
\providecommand\newthought[1]{%
   \addvspace{1.0\baselineskip plus 0.5ex minus 0.2ex}%
   \noindent\textsc{#1}}

% An environment for sign box
\newcommand{\signbox}[2]{
\begin{minipage}{0.5\linewidth}
\end{minipage}\hfill
\begin{minipage}{0.45\linewidth}
\begin{flushright}
\vbox{
    \begin{center}
	\textit{\@universitycity, date \space \space \space month \space \space \space year \@degreeyear}
	\\ #1
	\\~
	\\~
	\\ \textit{#2}
	\end{center}
}
\end{flushright}
\end{minipage}
}

% \dotline and \dotfill
\def\dotfill#1{\cleaders\hbox to #1{.}\hfill}
\newcommand\dotline[2][.5em]{\leavevmode\hbox to #2{\dotfill{#1}\hfil}}

\renewenvironment{savequote}[1][10cm]{%
\begin{lrbox}{\@quotebox}
\noindent
\begin{tabular*}{\textwidth}{@{\extracolsep{\fill}}lr|}
&\begin{minipage}[t]{#1}\footnotesize\quotefont
\ignorespaces
}{%
\end{minipage}
\end{tabular*}
\end{lrbox}
\global\setbox\@quotebox\copy\@quotebox
\global\let\@printcites\@iprintcites
\ignorespacesafterend}


% remove hyperlink, mostly used for citation in caption and headline
\newcommand{\nohyper}[1]{\protect\NoHyper#1\protect\endNoHyper}

\renewcommand\bibname{References}
\renewcommand\listfigurename{Listing of Figures}

% undo the wrong changes made by mathspec
\makeatletter 
\let\RequirePackage\original@RequirePackage
\let\usepackage\RequirePackage
\makeatother