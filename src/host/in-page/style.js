module.exports = `
.host
{
    position: fixed;
    z-index: 100000;
    display: flex;
    flex-direction: column;
    left: 0;
    right: 0;
    bottom: 0;
    height: 50%;
    border-top: 2px solid #AAA;
    background: #EEE;
    opacity: .9;
    font-family: Tahoma, Verdana, Arial, sans-serif;
    font-size: 12px
}

.toolbar
{
    display: -webkit-flex;
    display: flex;
    padding: 0;
    background: #F8F8F8;
    border-bottom: 1px solid #DDD;
}

.tab
{
  display: inline-block;
  padding: 8px 10px;
  color: #666;
  line-height: 1;
  cursor: pointer;
  border-bottom: 1px solid transparent;
}
.tab:hover
{
  background: #EEE;
}
.tab_selected
{
  color: #444;
  border-bottom: 2px solid rgba(62, 130, 247, .6);
  margin-bottom: -1px;
}

.button
{
    display: inline-block;
    padding: 4px;
    margin: 1px;
    background: #CCC;
}

.sandbox
{
    flex: 1;
    position: relative;
}
.sandbox > iframe
{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
    background: white;
}
`;
