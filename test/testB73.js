


describe('Ok test', function() {
  // getInstance() is removed since protractor v1.5.0
  ptor = (protractor.getInstance)? protractor.getInstance():browser;

  it('should success', function() {
    expect(1).toEqual(1);
    expect(1).toEqual(1);
    expect(1).toEqual(1);
    expect(1).toEqual(1);
  });
});
