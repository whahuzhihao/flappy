Vector = function(x,y)
{
	this.x=x;
	this.y=y;
}
Vector.prototype = 
{
    add : function(v) { this.x = this.x+v.x; this.y = this.y+v.y; },
    subtract : function(v) { this.x = this.x - v.x; this.y = this.y - v.y; },
    multiply : function(f) { return new Vector(this.x * f, this.y * f); }
};
Vector.zero = new Vector(0, 0);